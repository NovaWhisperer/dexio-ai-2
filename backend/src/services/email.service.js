import nodemailer from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "../../config/index.js";
import { logger } from "../utils/logger.js";

const transportor = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const sendMailer = async (to, subject, html) => {
  try {
    const info = await transportor.sendMail({ to, subject, html });
    logger.info(info);
  } catch (err) {
    logger.error(err);
    throw err;
  }
};

export default sendMailer;
