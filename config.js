require('dotenv').config();

const smtpConfigurations = [];
let i = 1;
while (process.env[`SMTP_HOST_${i}`]) {
    smtpConfigurations.push({
        host: process.env[`SMTP_HOST_${i}`],
        port: parseInt(process.env[`SMTP_PORT_${i}`], 10),
        secure: process.env[`SMTP_SECURE_${i}`] === 'true',
        auth: {
            user: process.env[`SMTP_USER_${i}`],
            pass: process.env[`SMTP_PASS_${i}`],
        },
    });
    i++;
}

const signature = process.env.SIGNATURE;
const nameMagxxic = process.env.NAME_MAGXXIC;

module.exports = {
    smtpConfigurations,
    signature,
    nameMagxxic,
};
