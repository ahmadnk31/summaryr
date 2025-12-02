import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if verification entry already exists
    const { data: existingVerification } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("user_id", userId)
      .eq("verified", false)
      .single()

    if (existingVerification) {
      // Entry already exists, return success
      return NextResponse.json({ success: true, message: "Verification entry already exists" })
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

    // Create verification entry in database
    const { error: dbError } = await supabase
      .from("email_verifications")
      .insert({
        user_id: userId,
        email: email,
        token,
        expires_at: expiresAt.toISOString(),
        verified: false,
      })

    if (dbError) {
      console.error("Error creating verification entry:", dbError)
      return NextResponse.json({ error: "Failed to create verification entry" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Verification entry created" })
  } catch (error) {
    console.error("Error in create-verification:", error)
    return NextResponse.json({ error: "Failed to create verification entry" }, { status: 500 })
  }
}

