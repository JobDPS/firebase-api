const axios = require("axios");
const config = require("../config");

module.exports = async (req, res, next) => {
  let refreshToken;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    refreshToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token found");
    return res.status(403).json({error: "Unauthorized"});
  }

  delete axios.defaults.headers.common["Authorization"];
  const data = await axios
      .post(`https://securetoken.googleapis.com/v1/token?key=${config.apiKey}`, {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      })
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  req.idToken = data.data.id_token;
  req.refresh_token = data.data.refresh_token;
  req.user = {};
  req.user.userId = data.data.user_id;

  const data2 = await axios
      .post(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.apiKey}`, {
        idToken: req.idToken,
      })
      .catch((err) => {
        return res.status(500).json({error: err.response.data.error.message});
      });

  req.user = {...req.user, ...data2.data.users[0]};
  return next();
};
