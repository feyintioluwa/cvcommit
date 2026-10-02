import { NextResponse } from "next/server";

import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

import { getCareerOSServerAccess } from "@/lib/access/server-access";

export async function POST(request: Request) {
  const access =
    await getCareerOSServerAccess();

  if (!access.authenticated) {
    return NextResponse.json(
      {
        error:
          "Sign in to upload and analyze a CV.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (
      !file ||
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "No CV file was provided.",
        },
        {
          status: 400,
        }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only PDF and DOCX files are supported.",
        },
        {
          status: 400,
        }
      );
    }

    const maxSize =
      10 * 1024 * 1024;

    if (
      file.size >
      maxSize
    ) {
      return NextResponse.json(
        {
          error:
            "File size must be less than 10MB.",
        },
        {
          status: 400,
        }
      );
    }

    const buffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    let extractedText =
      "";

    if (
      file.type ===
      "application/pdf"
    ) {
      const parser =
        new PDFParse({
          data: buffer,
        });

      try {
        const result =
          await parser.getText();

        extractedText =
          result.text;
      } finally {
        await parser.destroy();
      }
    }

    if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result =
        await mammoth.extractRawText({
          buffer,
        });

      extractedText =
        result.value;
    }

    extractedText =
      extractedText
        .replace(
          /\r\n/g,
          "\n"
        )
        .replace(
          /\n{3,}/g,
          "\n\n"
        )
        .replace(
          /[ \t]+/g,
          " "
        )
        .trim();

    if (!extractedText) {
      return NextResponse.json(
        {
          error:
            "We couldn't extract any readable text from this CV. The file may be scanned or image-based.",
        },
        {
          status: 422,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "CV uploaded and text extracted successfully.",
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      textLength:
        extractedText.length,
      extractedText,
    });
  } catch (error) {
    console.error(
      "CV processing error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while processing your CV.",
      },
      {
        status: 500,
      }
    );
  }
}