const { useDB, useConfig } = require("../../lib/hooks");
const config = useConfig();

module.exports.data = {
	name: "ShuzukoRank",
	type: "ranksys",
};

/**
 * @param { import ("discord.js").User } user
 * @param { Number } XpADD
 */

module.exports.execute = async ({ user, XpADD = 1 }) => {
	const DataBase = useDB();
	
	// Quick fallback for default language
	const getDefaultLang = () => {
		const langdef = require(`./../../lang/${config?.DeafultLang}`);
		return langdef;
	};
	
	if (DataBase && user) {
		try {
			// Add timeout to database operations (2 seconds max)
			const dbTimeout = new Promise((_, reject) => 
				setTimeout(() => reject(new Error('Database timeout')), 2000)
			);
			
			const dbQuery = DataBase.ShuzukoUser.findOne({ userID: user.id });
			
			// Race between database query and timeout
			const userDB = await Promise.race([dbQuery, dbTimeout]).catch(() => null);
			
			if (!userDB) {
				// If query failed or timed out, return default language
				return getDefaultLang();
			}
			
			// Destructure userDB to extract values with default assignments
			const { xp = 1, level = 1, coin = 1, lang, color } = userDB;

			// Calculate new xp
			let newXp = xp + XpADD;
			let newLevel = level;
			let newCoin = coin;

			// Level up if the new xp exceeds the threshold
			const xpThreshold = newLevel * 50 + 1;
			if (newXp > xpThreshold) {
				newLevel += 1;
				newXp = 1;
				newCoin += newLevel * 100;
			}

			// Update the user in the database (with timeout)
			const updateQuery = DataBase.ShuzukoUser.updateOne(
				{ userID: user.id },
				{
					$set: {
						xp: newXp,
						level: newLevel,
						coin: newCoin,
					},
				},
				{ upsert: true },
			);
			
			// Don't wait for update to complete, do it in background
			updateQuery.catch(() => {}); // Silent fail for update
			
			const langdef = require(`./../../lang/${lang || config?.DeafultLang}`);
			langdef.color = color;
			return langdef;
		} catch (error) {
			// If any database operation fails, return default language
			console.log('Database error in ShuzukoRank, using fallback:', error.message);
			return getDefaultLang();
		}
	} else {
		// If the database is not available, return default language
		return getDefaultLang();
	}
};


