const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
// const saltRounds =
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

const Note = conn.define('note', {
  note: STRING,
});

User.hasMany(Note);
Note.belongsTo(User);

User.byToken = async (token) => {
  try {
    const verifiedToken = jwt.verify(token, process.env.JWT);
    const user = await User.findByPk(verifiedToken.userId);
    if (user) {
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.beforeCreate(async (user) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;
});

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
    },
  });

  const result = await bcrypt.compare(password, user.password);

  if (result) {
    const token = jwt.sign({ userId: user.id }, process.env.JWT);
    return {user, token};
    // return user.id;
  }

  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const syncAndSeed = async () => {
  await conn.sync({ /*force: true*/ });
  // const credentials = [
  //   { username: 'lucy', password: 'lucy_pw' },
  //   { username: 'moe', password: 'moe_pw' },
  //   { username: 'larry', password: 'larry_pw' },
  // ];
  // const [lucy, moe, larry] = await Promise.all(
  //   credentials.map((credential) => User.create(credential))
  // );
  //
  // lucy.addNote(
  //   await Note.create({
  //     note: `I love Lucy`,
  //   })
  // );
  // moe.addNote(
  //   await Note.create({
  //     note: `Password is easy`,
  //   })
  // );
  // larry.addNote(
  //   await Note.create({
  //     note: `I love lobster`,
  //   })
  // );
  //
  // return {
  //   users: {
  //     lucy,
  //     moe,
  //     larry,
  //   },
  // };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note,
  },
};
