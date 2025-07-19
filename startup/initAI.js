const { GoogleGenerativeAI } = require("@google/generative-ai");
const { useDB, useAI, setAI, useLogger, useClient, useConfig } = require("../lib/hooks");
const config = useConfig();
const client = useClient();

const promptBuilder = async ({ content, user, lang, DataBase }) => {
	const { promptHistory, CurrentAI, CurrentUser } = (await DataBase.ShuzukoUser.findOne({ userID: user?.id })) || {};

	const lowerContent = content?.toLowerCase()?.trim();
	const language = lang?.local_names || "vi_VN";

	const old_Prompt = `${
		promptHistory ??
		`You are Phuong Trang Discord bot. Supports slash commands including: avatar, help, language, ping, translate, disconnect, userinfo, ban, purge, volumec, weather, kick, timeout, unban, untimeout, lyrics, statistics, play next, play assistant, play music, player, autoresponder new, autoresponder edit, welcomer setup, ai ask, ai assistant, decrypt, encrypt, variable, tts, voice log.`
	}\n${user?.username}: ${CurrentUser} \n${client.user.username}: ${CurrentAI}`.slice(-13000);

	const userPrompt = lowerContent ? `${user?.username} có câu hỏi: ${lowerContent}` : "How can I assist you today?";

	const Prompt =
		language === "vi_VN" ?
			`Context:\n${old_Prompt}\nPrompt: ${userPrompt}, Hãy trả lời bằng tiếng Việt.`
		:	`Context:\n${old_Prompt}\nPrompt: ${userPrompt}, Please respond in ${language}.`;
	//16384 token

	return { Prompt, old_Prompt };
};

module.exports = async () => {
	try {
		console.log('🔍 [DEBUG] Checking AI initialization...');
		console.log('🔍 [DEBUG] config.DevConfig.ai:', config.DevConfig.ai);
		console.log('🔍 [DEBUG] GEMINI_API_KEY exists:', !!process.env?.GEMINI_API_KEY);
		console.log('🔍 [DEBUG] GEMINI_API_KEY length:', process.env?.GEMINI_API_KEY?.length);
		
		if (!config.DevConfig.ai || !process.env?.GEMINI_API_KEY?.length) {
			console.log('❌ [DEBUG] AI initialization skipped - config or API key missing');
			return;
		}

		console.log('✅ [DEBUG] Initializing Google AI...');
		const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
		const DataBase = useDB();

		console.log('✅ [DEBUG] Setting up useAI hook...');
		setAI({
			client,
			genAI,
			run: async (prompt, user, lang) => {
				const generationConfig = {
					stopSequences: ["red"],
					temperature: 0.9,
					topP: 0.1,
					topK: 16,
				};
				const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig });
				const { Prompt, old_Prompt } = await promptBuilder({ content: prompt, user, lang, DataBase });
				console.log("Prompt:", Prompt);
				console.log("Old Prompt:", old_Prompt);
				const result = await model.generateContent(Prompt, {});
				const text = result?.response?.text();

				if (!text) return "Lỗi khi gọi AI";
				if (!user) return text;

				await DataBase.ShuzukoUser.updateOne(
					{ userID: user?.id },
					{
						$set: {
							promptHistory: old_Prompt,
							CurrentAI: text,
							CurrentUser: prompt,
						},
					},
					{ upsert: true },
				);

				return text;
			},
		});

		console.log('🎉 [DEBUG] AI model loaded successfully!');
		useLogger().info(`Successfully loaded Ai model.`);
	} catch (error) {
		console.log('❌ [DEBUG] Error loading AI model:', error);
		useLogger().error("Lỗi khi tải Ai model:", error);
	}
};

