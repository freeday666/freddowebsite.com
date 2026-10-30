// Server instellingen in-memory (of ingeladen uit .env)
let config = {
  discordBotToken: process.env.DISCORD_BOT_TOKEN || '',
  guildId: process.env.GUILD_ID || '',
  staffRoleId: process.env.STAFF_ROLE_ID || ''
};

// API Route: Instellingen ophalen
app.get('/api/settings', (req, res) => {
  // Verberg het token deels om veiligheidsredenen in de frontend
  const maskedToken = config.discordBotToken 
    ? config.discordBotToken.substring(0, 8) + '...' 
    : '';

  res.json({
    discordBotToken: maskedToken,
    hasToken: Boolean(config.discordBotToken),
    guildId: config.guildId,
    staffRoleId: config.staffRoleId
  });
});

// API Route: Instellingen opslaan
app.post('/api/settings', (req, res) => {
  const { discordBotToken, guildId, staffRoleId } = req.body;

  if (guildId !== undefined) config.guildId = guildId;
  if (staffRoleId !== undefined) config.staffRoleId = staffRoleId;
  
  // Update token alleen als er een nieuwe waarde is meegegeven
  if (discordBotToken && !discordBotToken.includes('...')) {
    config.discordBotToken = discordBotToken;
    addLog("Discord Bot Token bijgewerkt.");
  }

  addLog(`Instellingen bijgewerkt -> Guild ID: ${config.guildId || 'Niet ingesteld'} | Staff Role: ${config.staffRoleId || 'Niet ingesteld'}`);
  
  res.json({ success: true, message: "Instellingen succesvol opgeslagen!" });
});
