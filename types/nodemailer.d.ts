declare module "nodemailer" {
  interface Message {
    from?: string
    to: string
    subject: string
    text: string
  }

  interface Transporter {
    // eslint-disable-next-line no-unused-vars
    sendMail(message: Message): Promise<unknown>
  }

  const nodemailer: {
    // eslint-disable-next-line no-unused-vars
    createTransport(url: string): Transporter
  }

  export default nodemailer
}
