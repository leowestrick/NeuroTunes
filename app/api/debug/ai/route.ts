import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function GET(req: NextRequest) {
  try {
    // Debug-Informationen sammeln
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasGoogleAIKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        keyLength: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.length || 0,
        keyPrefix: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 10) + "..." || "not found",
      },
      test: null as any,
      error: null as string | null,
    }

    // Teste Google AI API
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        console.log("Testing Google AI API...")

        const model = google("gemini-1.5-flash", {
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        })

        const { text } = await generateText({
          model,
          prompt: "Antworte mit einem einfachen 'Test erfolgreich' auf Deutsch.",
          temperature: 0.1,
          maxTokens: 50,
        })

        debugInfo.test = {
          success: true,
          response: text,
          responseLength: text.length,
        }
      } catch (aiError) {
        console.error("Google AI Test Error:", aiError)
        debugInfo.test = {
          success: false,
          error: aiError instanceof Error ? aiError.message : "Unknown AI error",
        }
        debugInfo.error = aiError instanceof Error ? aiError.message : "Unknown AI error"
      }
    } else {
      debugInfo.error = "Google AI API Key not found"
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    console.error("Debug AI Error:", error)
    return NextResponse.json(
      {
        error: "Debug error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
