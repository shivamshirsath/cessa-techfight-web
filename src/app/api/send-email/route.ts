// src/app/api/send-email/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { type, email, name, eventName, utr, amount } = await req.json();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let subject = '';
    let htmlContent = '';

    // 1. UNDER REVIEW TEMPLATE
    if (type === 'SUBMITTED') {
      subject = `Application Received: ${eventName} - TechFight 2026`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <h2 style="color: #111827; margin: 0;">TechFight 2026</h2>
          </div>
          <div style="padding: 30px; color: #374151;">
            <p>Hi <strong>${name}</strong>,</p>
            <p>We have successfully received your application and payment details for <strong>${eventName}</strong>.</p>
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #b45309;"><strong>Status:</strong> Under Review 🕒</p>
              <p style="margin: 5px 0 0 0; font-size: 14px;">UTR Number: ${utr}</p>
            </div>
            <p>Our Treasurer is currently verifying your transaction. You will receive another email once your registration is officially confirmed.</p>
          </div>
        </div>
      `;
    } 
    
    // 2. ACCEPTED / RECEIPT TEMPLATE
    else if (type === 'ACCEPTED') {
      subject = `✅ Registration Confirmed & Receipt: ${eventName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #9E1B42; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0;">Payment Verified!</h2>
          </div>
          <div style="padding: 30px; color: #374151;">
            <p>Congratulations <strong>${name}</strong>,</p>
            <p>Your payment has been verified by the Treasurer. You are officially registered for <strong>${eventName}</strong>!</p>
            
            <div style="border: 2px dashed #e5e7eb; border-radius: 8px; padding: 20px; margin: 30px 0; background-color: #f9fafb;">
              <h3 style="margin-top: 0; color: #111827; text-align: center; text-transform: uppercase; letter-spacing: 2px; font-size: 14px;">Official Receipt</h3>
              <table style="width: 100%; margin-top: 20px; font-size: 15px;">
                <tr><td style="padding: 8px 0; color: #6b7280;">Participant Name:</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${name}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Event:</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${eventName}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">UTR Number:</td><td style="padding: 8px 0; text-align: right; font-family: monospace;">${utr}</td></tr>
                <tr><td colspan="2"><hr style="border: none; border-top: 1px solid #e5e7eb; margin: 10px 0;" /></td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #111827;">Total Paid:</td><td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 18px; color: #16a34a;">₹${amount}</td></tr>
              </table>
            </div>
            
            <p>Please keep this email for your records. We look forward to seeing you at TechFight 2026!</p>
          </div>
        </div>
      `;
    } 
    
    // 3. REJECTED TEMPLATE
    else if (type === 'REJECTED') {
      subject = `❌ Action Required: Issue with ${eventName} Registration`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #ef4444; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #fef2f2; padding: 20px; text-align: center; border-bottom: 1px solid #fecaca;">
            <h2 style="color: #b91c1c; margin: 0;">Payment Verification Failed</h2>
          </div>
          <div style="padding: 30px; color: #374151;">
            <p>Hi <strong>${name}</strong>,</p>
            <p>Unfortunately, our Treasurer could not verify your payment for <strong>${eventName}</strong> using the UTR number provided (<code>${utr}</code>).</p>
            <p>This usually happens if:</p>
            <ul style="color: #4b5563;">
              <li>The UTR number was typed incorrectly.</li>
              <li>The transaction failed on the bank's end.</li>
              <li>The payment was sent to the wrong UPI ID.</li>
            </ul>
            <p><strong>Please log in to your dashboard and re-apply with the correct UTR number or a new successful transaction.</strong></p>
          </div>
        </div>
      `;
    }

    // Send the email
    await transporter.sendMail({
      from: `"TechFight Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email Send Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}