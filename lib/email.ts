import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const ses = new SESClient({ region: process.env.AWS_REGION })

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await ses.send(new SendEmailCommand({
    Source: process.env.AWS_SES_FROM_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: html } },
    },
  }))
}
