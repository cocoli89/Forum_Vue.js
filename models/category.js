let randomColor = require('randomcolor')

module.exports = (sequelize, DataTypes) => {
	let Category = sequelize.define('Category', {
		name: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
			validate: {
				notEmpty: {
					msg: 'The category name can\'t be empty'
				},
				isString (val) {
					if(typeof val !== 'string') {
						throw new sequelize.ValidationError('The category name must be a string')
					}
				}
			}
		},
		value: {
			type: DataTypes.STRING,
			unique: true
		},
		color: {
			type: DataTypes.STRING,
			defaultValue () {
				return randomColor({ luminosity: 'bright' })
			}
		}
	}, {
		hooks: {
			beforeCreate (category) {
				if(!category.name) {
					throw new sequelize.ValidationError('The category name cant\'t be empty')
				} else {
					let underscored = category.name.trim().replace(/\s/g, '_').toUpperCase()
					category.value = underscored
				}
			}
		},
		classMethods: {
			associate (models) {
				Category.hasMany(models.Thread)
			}
		}
	})

	return Category
}