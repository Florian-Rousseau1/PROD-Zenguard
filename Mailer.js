let nodemailer = require("nodemailer");

class Mailer {
    send(dest, subject, content) {
        let transporter = nodemailer.createTransport({
            host: "mail48.lwspanel.com",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: 'alert@arcanite-rp.fr',
                pass: 'fQ1_3XJQ4GkD!$T'
            }
        });

        let mailOptions = {
            from: 'alert@arcanite-rp.fr',
            to: dest,
            subject: subject,
            html: content
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }
}

module.exports = Mailer
/*

    let mail = new Mailer();
    mail.send("flo.rousseau14210@gmail.com", "ZENGUARD MSG : ", "blablabl");
*/