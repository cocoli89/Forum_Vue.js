let randomColor = require('randomcolor')

module.exports = (sequelize, DataTypes) => {
	let User = sequelize.define('User', {
		username: {
			type: DataTypes.STRING,
			unique: true
		},
		color: {
			type: DataTypes.STRING,
			defaultValue () {
				return randomColor({ luminosity: 'bright' })
			}
		},
		hash: DataTypes.STRING,
		admin: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		}
	})

	return User
}