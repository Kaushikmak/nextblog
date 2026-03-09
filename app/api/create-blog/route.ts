import { NextResponse } from "next/server";

export async function POST() {
    console.log("hello from the server but this is post request");

    return NextResponse.json({success: true})
}