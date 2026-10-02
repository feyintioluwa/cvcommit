import { NextResponse } from "next/server";

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

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
    !Number.isFinite(
      order
    )
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

  const fileName =
    stringValue(
      raw.fileName
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
    sections.length ===
    0
  ) {
    return null;
  }

  return {
    cvHash,
    fileName,
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

function createHeaderParagraphs(
  content: string
): Paragraph[] {
  const lines =
    content
      .split("\n")
      .map(
        (line) =>
          line.trim()
      )
      .filter(Boolean);

  if (
    lines.length ===
    0
  ) {
    return [];
  }

  const [
    name,
    ...details
  ] = lines;

  const paragraphs:
    Paragraph[] = [
      new Paragraph({
        alignment:
          AlignmentType.CENTER,
        spacing: {
          after: 100,
        },
        children: [
          new TextRun({
            text:
              name,
            bold:
              true,
            size:
              34,
          }),
        ],
      }),
    ];

  if (
    details.length >
    0
  ) {
    paragraphs.push(
      new Paragraph({
        alignment:
          AlignmentType.CENTER,
        spacing: {
          after:
            260,
        },
        children: [
          new TextRun({
            text:
              details.join(
                " | "
              ),
            size:
              20,
          }),
        ],
        border: {
          bottom: {
            style:
              BorderStyle.SINGLE,
            size:
              8,
            color:
              "222222",
            space:
              8,
          },
        },
      })
    );
  }

  return paragraphs;
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

function createBodyParagraphs(
  content: string
): Paragraph[] {
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

  const paragraphs:
    Paragraph[] = [];

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
        paragraphs.push(
          new Paragraph({
            text:
              cleanBullet(
                line
              ),
            bullet: {
              level:
                0,
            },
            spacing: {
              after:
                80,
              line:
                260,
            },
          })
        );

        continue;
      }

      paragraphs.push(
        new Paragraph({
          spacing: {
            after:
              100,
            line:
              260,
          },
          children: [
            new TextRun({
              text:
                line,
              size:
                21,
            }),
          ],
        })
      );
    }

    paragraphs.push(
      new Paragraph({
        spacing: {
          after:
            60,
        },
      })
    );
  }

  return paragraphs;
}

function createSectionParagraphs(
  section: ExportSection
): Paragraph[] {
  if (
    section.key ===
    "header"
  ) {
    return createHeaderParagraphs(
      section.content
    );
  }

  return [
    new Paragraph({
      heading:
        HeadingLevel.HEADING_2,
      spacing: {
        before:
          220,
        after:
          120,
      },
      border: {
        bottom: {
          style:
            BorderStyle.SINGLE,
          size:
            5,
          color:
            "AAAAAA",
          space:
            5,
        },
      },
      children: [
        new TextRun({
          text:
            section.title.toUpperCase(),
          bold:
            true,
          size:
            22,
        }),
      ],
    }),

    ...createBodyParagraphs(
      section.content
    ),
  ];
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
            "Invalid export request.",
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
            "CVCommit could not prepare this CV for export.",
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
     * independently verifies that the signed-in user has paid
     * access to this exact CV before generating the DOCX.
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
            "This CV must be unlocked before you can export a DOCX file.",
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

    const children =
      exportRequest.sections.flatMap(
        createSectionParagraphs
      );

    const document =
      new Document({
        creator:
          "CVCommit",
        title:
          "CVCommit Improved CV",
        description:
          "Improved CV generated with CVCommit",
        styles: {
          default: {
            document: {
              run: {
                font:
                  "Arial",
                size:
                  21,
                color:
                  "222222",
              },
              paragraph: {
                spacing: {
                  line:
                    260,
                },
              },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top:
                    720,
                  right:
                    720,
                  bottom:
                    720,
                  left:
                    720,
                },
              },
            },
            children,
          },
        ],
      });

    const buffer =
      await Packer.toBuffer(
        document
      );

    const downloadName =
      `${cleanDownloadName(
        exportRequest.fileName
      )}-CVCommit.docx`;

    return new NextResponse(
      new Uint8Array(
        buffer
      ),
      {
        status:
          200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition":
            `attachment; filename="${downloadName}"`,
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "CVCommit DOCX export error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,
        error:
          "Something went wrong while creating the DOCX file.",
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
        "CVCommit DOCX export only accepts POST requests.",
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
