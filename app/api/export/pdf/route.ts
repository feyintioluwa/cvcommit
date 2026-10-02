import { NextResponse } from "next/server";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import {
  getCareerOSCVAccess,
} from "@/lib/access/server-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RawObject = Record<string, unknown>;

type ExportSection = {
  key: string;
  title: string;
  content: string;
  order: number;
};

type ExportRequest = {
  cvHash: string;
  fileName: string;
  sections: ExportSection[];
};

type PDFState = {
  pdf: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  boldFont: PDFFont;
  y: number;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN_X = 48;
const MARGIN_TOP = 52;
const MARGIN_BOTTOM = 52;

const BODY_SIZE = 10.5;
const HEADING_SIZE = 11;
const NAME_SIZE = 18;

const BODY_LINE_HEIGHT = 15;
const BULLET_INDENT = 14;

function stringValue(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeSection(
  value: unknown
): ExportSection | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const raw =
    value as RawObject;

  const key =
    stringValue(
      raw.key
    );

  const title =
    stringValue(
      raw.title
    );

  const content =
    stringValue(
      raw.content
    );

  const order =
    Number(
      raw.order
    );

  if (
    !key ||
    !title ||
    !content ||
    !Number.isFinite(order)
  ) {
    return null;
  }

  return {
    key,
    title,
    content,
    order,
  };
}

function normalizeRequest(
  value: unknown
): ExportRequest | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const raw =
    value as RawObject;

  const cvHash =
    stringValue(
      raw.cvHash
    );

  if (
    !cvHash ||
    !Array.isArray(
      raw.sections
    )
  ) {
    return null;
  }

  const sections =
    raw.sections
      .map(
        normalizeSection
      )
      .filter(
        (
          section
        ): section is ExportSection =>
          section !== null
      )
      .sort(
        (a, b) =>
          a.order -
          b.order
      );

  if (
    sections.length === 0
  ) {
    return null;
  }

  return {
    cvHash,
    fileName:
      stringValue(
        raw.fileName
      ),
    sections,
  };
}

function cleanDownloadName(
  fileName: string
): string {
  const withoutExtension =
    fileName.replace(
      /\.(pdf|docx)$/i,
      ""
    );

  const cleaned =
    withoutExtension
      .replace(
        /[^a-zA-Z0-9 _-]/g,
        ""
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  return cleaned ||
    "CVCommit-CV";
}

function isBulletLine(
  line: string
): boolean {
  return /^[-•▪◦*]\s+/.test(
    line
  );
}

function cleanBullet(
  line: string
): string {
  return line.replace(
    /^[-•▪◦*]\s+/,
    ""
  );
}

function createPage(
  state: Omit<
    PDFState,
    "page" | "y"
  >
): PDFState {
  const page =
    state.pdf.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

  return {
    ...state,
    page,
    y:
      PAGE_HEIGHT -
      MARGIN_TOP,
  };
}

function ensureSpace(
  state: PDFState,
  requiredHeight: number
): PDFState {
  if (
    state.y -
      requiredHeight >=
    MARGIN_BOTTOM
  ) {
    return state;
  }

  return createPage({
    pdf:
      state.pdf,

    font:
      state.font,

    boldFont:
      state.boldFont,
  });
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const words =
    text
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.length === 0
  ) {
    return [];
  }

  const lines:
    string[] = [];

  let currentLine =
    "";

  for (
    const word of
    words
  ) {
    const candidate =
      currentLine
        ? `${currentLine} ${word}`
        : word;

    const width =
      font.widthOfTextAtSize(
        candidate,
        fontSize
      );

    if (
      width <=
      maxWidth
    ) {
      currentLine =
        candidate;

      continue;
    }

    if (currentLine) {
      lines.push(
        currentLine
      );
    }

    /*
     * Handle a single unusually long word.
     */
    if (
      font.widthOfTextAtSize(
        word,
        fontSize
      ) <=
      maxWidth
    ) {
      currentLine =
        word;

      continue;
    }

    let partial =
      "";

    for (
      const character of
      word
    ) {
      const next =
        partial +
        character;

      if (
        font.widthOfTextAtSize(
          next,
          fontSize
        ) >
          maxWidth &&
        partial
      ) {
        lines.push(
          partial
        );

        partial =
          character;
      } else {
        partial =
          next;
      }
    }

    currentLine =
      partial;
  }

  if (
    currentLine
  ) {
    lines.push(
      currentLine
    );
  }

  return lines;
}

function drawWrappedText({
  state,
  text,
  x,
  maxWidth,
  font,
  fontSize,
  lineHeight,
  color = rgb(
    0.18,
    0.18,
    0.18
  ),
}: {
  state: PDFState;
  text: string;
  x: number;
  maxWidth: number;
  font: PDFFont;
  fontSize: number;
  lineHeight: number;
  color?: ReturnType<
    typeof rgb
  >;
}): PDFState {
  const lines =
    wrapText(
      text,
      font,
      fontSize,
      maxWidth
    );

  let current =
    state;

  for (
    const line of
    lines
  ) {
    current =
      ensureSpace(
        current,
        lineHeight
      );

    current.page.drawText(
      line,
      {
        x,
        y:
          current.y -
          fontSize,

        size:
          fontSize,

        font,

        color,
      }
    );

    current = {
      ...current,
      y:
        current.y -
        lineHeight,
    };
  }

  return current;
}

function drawHeader(
  state: PDFState,
  content: string
): PDFState {
  const lines =
    content
      .split("\n")
      .map(
        (line) =>
          line.trim()
      )
      .filter(Boolean);

  if (
    lines.length === 0
  ) {
    return state;
  }

  let current =
    ensureSpace(
      state,
      70
    );

  const [
    name,
    ...details
  ] = lines;

  const nameWidth =
    current.boldFont
      .widthOfTextAtSize(
        name,
        NAME_SIZE
      );

  current.page.drawText(
    name,
    {
      x:
        Math.max(
          MARGIN_X,
          (
            PAGE_WIDTH -
            nameWidth
          ) /
            2
        ),

      y:
        current.y -
        NAME_SIZE,

      size:
        NAME_SIZE,

      font:
        current.boldFont,

      color:
        rgb(
          0.08,
          0.08,
          0.08
        ),
    }
  );

  current = {
    ...current,
    y:
      current.y -
      28,
  };

  if (
    details.length > 0
  ) {
    const detailText =
      details.join(
        " | "
      );

    const detailLines =
      wrapText(
        detailText,
        current.font,
        9.5,
        PAGE_WIDTH -
          MARGIN_X * 2
      );

    for (
      const line of
      detailLines
    ) {
      current =
        ensureSpace(
          current,
          13
        );

      const width =
        current.font
          .widthOfTextAtSize(
            line,
            9.5
          );

      current.page.drawText(
        line,
        {
          x:
            Math.max(
              MARGIN_X,
              (
                PAGE_WIDTH -
                width
              ) /
                2
            ),

          y:
            current.y -
            9.5,

          size:
            9.5,

          font:
            current.font,

          color:
            rgb(
              0.32,
              0.32,
              0.32
            ),
        }
      );

      current = {
        ...current,
        y:
          current.y -
          13,
      };
    }
  }

  current.page.drawLine({
    start: {
      x:
        MARGIN_X,
      y:
        current.y -
        6,
    },

    end: {
      x:
        PAGE_WIDTH -
        MARGIN_X,
      y:
        current.y -
        6,
    },

    thickness:
      1,

    color:
      rgb(
        0.15,
        0.15,
        0.15
      ),
  });

  return {
    ...current,
    y:
      current.y -
      22,
  };
}

function drawSectionHeading(
  state: PDFState,
  title: string
): PDFState {
  const current =
    ensureSpace(
      state,
      34
    );

  current.page.drawText(
    title.toUpperCase(),
    {
      x:
        MARGIN_X,

      y:
        current.y -
        HEADING_SIZE,

      size:
        HEADING_SIZE,

      font:
        current.boldFont,

      color:
        rgb(
          0.08,
          0.08,
          0.08
        ),
    }
  );

  current.page.drawLine({
    start: {
      x:
        MARGIN_X,
      y:
        current.y -
        17,
    },

    end: {
      x:
        PAGE_WIDTH -
        MARGIN_X,
      y:
        current.y -
        17,
    },

    thickness:
      0.65,

    color:
      rgb(
        0.72,
        0.72,
        0.72
      ),
  });

  return {
    ...current,
    y:
      current.y -
      29,
  };
}

function drawSectionContent(
  state: PDFState,
  content: string
): PDFState {
  const blocks =
    content
      .split(
        /\n{2,}/
      )
      .map(
        (block) =>
          block.trim()
      )
      .filter(Boolean);

  let current =
    state;

  for (
    const block of
    blocks
  ) {
    const lines =
      block
        .split("\n")
        .map(
          (line) =>
            line.trim()
        )
        .filter(Boolean);

    for (
      const line of
      lines
    ) {
      if (
        isBulletLine(
          line
        )
      ) {
        current =
          ensureSpace(
            current,
            BODY_LINE_HEIGHT
          );

        current.page.drawText(
          "-",
          {
            x:
              MARGIN_X +
              2,

            y:
              current.y -
              BODY_SIZE,

            size:
              BODY_SIZE,

            font:
              current.font,

            color:
              rgb(
                0.18,
                0.18,
                0.18
              ),
          }
        );

        current =
          drawWrappedText({
            state:
              current,

            text:
              cleanBullet(
                line
              ),

            x:
              MARGIN_X +
              BULLET_INDENT,

            maxWidth:
              PAGE_WIDTH -
              MARGIN_X * 2 -
              BULLET_INDENT,

            font:
              current.font,

            fontSize:
              BODY_SIZE,

            lineHeight:
              BODY_LINE_HEIGHT,
          });

        continue;
      }

      current =
        drawWrappedText({
          state:
            current,

          text:
            line,

          x:
            MARGIN_X,

          maxWidth:
            PAGE_WIDTH -
            MARGIN_X * 2,

          font:
            current.font,

          fontSize:
            BODY_SIZE,

          lineHeight:
            BODY_LINE_HEIGHT,
        });
    }

    current = {
      ...current,
      y:
        current.y -
        6,
    };
  }

  return current;
}

function drawSection(
  state: PDFState,
  section: ExportSection
): PDFState {
  if (
    section.key ===
    "header"
  ) {
    return drawHeader(
      state,
      section.content
    );
  }

  let current =
    drawSectionHeading(
      state,
      section.title
    );

  current =
    drawSectionContent(
      current,
      section.content
    );

  return {
    ...current,
    y:
      current.y -
      6,
  };
}

export async function POST(
  request: Request
) {
  try {
    let body:
      unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Invalid PDF export request.",
        },
        {
          status:
            400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const exportRequest =
      normalizeRequest(
        body
      );

    if (
      !exportRequest
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "CVCommit could not prepare this CV for PDF export.",
        },
        {
          status:
            400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    /*
     * ---------------------------------------------------------
     * SERVER-SIDE CV ENTITLEMENT
     * ---------------------------------------------------------
     *
     * The browser supplies the active CV hash, but the server
     * verifies that the signed-in user has paid access to this
     * exact CV before generating the PDF.
     */
    const access =
      await getCareerOSCVAccess(
        exportRequest.cvHash
      );

    if (!access.authenticated) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Sign in to export your CVCommit CV.",
        },
        {
          status:
            401,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    if (!access.hasPaidAccess) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "This CV must be unlocked before you can export a PDF file.",
        },
        {
          status:
            403,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const pdf =
      await PDFDocument.create();

    pdf.setTitle(
      "CVCommit Improved CV"
    );

    pdf.setAuthor(
      "CVCommit"
    );

    pdf.setCreator(
      "CVCommit"
    );

    pdf.setProducer(
      "CVCommit"
    );

    const font =
      await pdf.embedFont(
        StandardFonts.Helvetica
      );

    const boldFont =
      await pdf.embedFont(
        StandardFonts.HelveticaBold
      );

    let state =
      createPage({
        pdf,
        font,
        boldFont,
      });

    for (
      const section of
      exportRequest.sections
    ) {
      state =
        drawSection(
          state,
          section
        );
    }

    const bytes =
      await pdf.save();

    const downloadName =
      `${cleanDownloadName(
        exportRequest.fileName
      )}-CVCommit.pdf`;

    return new NextResponse(
      Buffer.from(
        bytes
      ),
      {
        status:
          200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="${downloadName}"`,

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "CVCommit PDF export error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          "Something went wrong while creating the PDF file.",
      },
      {
        status:
          500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success:
        false,

      error:
        "CVCommit PDF export only accepts POST requests.",
    },
    {
      status:
        405,

      headers: {
        Allow:
          "POST",
      },
    }
  );
}