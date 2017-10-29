module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET_KEY // Shared secret to encrypt JSON Web Token.
  },
  webAppUrl: process.env.WEB_APP_URL,
  emailSender: 'Blocky <getblocky.com@gmail.com>',
  accessKeyId: 'accessKeyId',
	secretAccessKey: 'secretAccessKey'
};
