const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Franchise = require('../models/Franchise');
const { protect } = require('../middleware/auth');

// Grok client (OpenAI-compatible)
const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const SYSTEM_PROMPT = `You are FranchiseIQ, an expert franchise advisor for the Indian market, specifically Chennai. 
You help first-time entrepreneurs discover and understand franchise opportunities.
Always respond in simple, clear language avoiding business jargon.
Base your advice on real data provided to you. Be specific, practical, and honest about risks.
Format responses in clean JSON when structured data is needed.`;

// POST /api/ai/recommend — Core recommendation engine
router.post('/recommend', protect, async (req, res) => {
  try {
    const { budget, zones, categories, experience, riskTolerance, timeAvailability } = req.body;

    // Fetch relevant franchises from DB
    const query = { status: 'active' };
    if (categories?.length) query.category = { $in: categories };
    if (budget?.max) query['investment.max'] = { $lte: Number(budget.max) };
    if (budget?.min) query['investment.min'] = { $gte: Number(budget.min) };

    const franchises = await Franchise.find(query).sort('-viabilityScore').limit(30).lean();

    if (!franchises.length) {
      return res.json({ success: true, recommendations: [], message: 'No franchises match your criteria' });
    }

    // Build compact franchise list for Grok
    const franchiseList = franchises.map(f => ({
      id: f._id,
      name: f.name,
      category: f.category,
      brand: f.brandType,
      investment: `₹${f.investment.min}-${f.investment.max} Lakhs`,
      fee: `₹${f.franchiseFee.min}-${f.franchiseFee.max} Lakhs`,
      royalty: f.royaltyLevel,
      zones: f.zones,
      beginner: f.beginnerFriendly,
      complexity: f.operationalComplexity,
      breakeven: `${f.breakevenMonths.min}-${f.breakevenMonths.max} months`,
      revenue: `₹${Math.round(f.monthlyRevenue.min/100000)}-${Math.round(f.monthlyRevenue.max/100000)} Lakhs/month`,
      viability: f.viabilityScore,
    }));

    const userProfile = {
      budget: `₹${budget?.min || 0}-${budget?.max || 50} Lakhs`,
      preferredZones: zones || [],
      preferredCategories: categories || [],
      experience: experience || 'none',
      riskTolerance: riskTolerance || 'medium',
      timeAvailability: timeAvailability || 'full-time',
    };

    const prompt = `
Seeker profile: ${JSON.stringify(userProfile)}

Available franchises: ${JSON.stringify(franchiseList)}

Task: Rank the TOP 6 best-matching franchises for this seeker. 
For each, give:
1. matchScore (0-100) based on how well it fits their profile
2. matchReason (2 sentences max - why it suits them specifically)
3. keyRisk (1 sentence - most important risk for this person)
4. quickVerdict (10 words max - plain English summary)

Return ONLY a JSON array: [{"id":"...","matchScore":85,"matchReason":"...","keyRisk":"...","quickVerdict":"..."}]
No preamble, no markdown, just the JSON array.`;

    const completion = await grok.chat.completions.create({
      model: 'grok-3-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    let rawText = completion.choices[0].message.content.trim();
    // Strip markdown if present
    rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let aiRankings;
    try {
      aiRankings = JSON.parse(rawText);
    } catch {
      // Fallback: sort by viability score
      aiRankings = franchises.slice(0, 6).map(f => ({
        id: f._id,
        matchScore: f.viabilityScore,
        matchReason: 'Recommended based on your budget and preferences.',
        keyRisk: 'Verify local market demand before investing.',
        quickVerdict: 'Good match for your profile'
      }));
    }

    // Enrich with full franchise data
    const recommendations = aiRankings.map(r => {
      const franchise = franchises.find(f => f._id.toString() === r.id?.toString());
      return franchise ? { ...franchise, ...r } : null;
    }).filter(Boolean);

    // Save quiz result to user
    if (req.user) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user._id, {
        'seekerProfile.lastQuizResult': { profile: userProfile, recommendations: recommendations.slice(0, 3).map(r => r._id), timestamp: new Date() },
        'seekerProfile.quizCompleted': true,
        'seekerProfile.budget': budget,
        'seekerProfile.preferredZones': zones,
        'seekerProfile.preferredCategories': categories,
        'seekerProfile.experience': experience,
        'seekerProfile.riskTolerance': riskTolerance,
      });
    }

    res.json({ success: true, recommendations, total: franchises.length });
  } catch (err) {
    console.error('AI recommend error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/explain — Explain a specific franchise in plain language
router.post('/explain', protect, async (req, res) => {
  try {
    const { franchiseId, question } = req.body;
    const franchise = await Franchise.findById(franchiseId).lean();
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });

    const franchiseData = `
Name: ${franchise.name}
Category: ${franchise.category}
Brand: ${franchise.brandType}
Description: ${franchise.description}
Investment: ₹${franchise.investment.min}-${franchise.investment.max} Lakhs
Franchise Fee: ₹${franchise.franchiseFee.min}-${franchise.franchiseFee.max} Lakhs
Royalty: ${franchise.royaltyLevel}
Min Area: ${franchise.minArea} sq.ft
Chennai Zones: ${franchise.zones?.join(', ')}
Staff Required: ${franchise.staffRequired}
Training Provided: ${franchise.trainingProvided ? 'Yes' : 'No'}
Beginner Friendly: ${franchise.beginnerFriendly ? 'Yes' : 'No'}
Operational Complexity: ${franchise.operationalComplexity}
Expected Monthly Revenue: ₹${Math.round(franchise.monthlyRevenue.min/100000)}-${Math.round(franchise.monthlyRevenue.max/100000)} Lakhs
Breakeven Period: ${franchise.breakevenMonths.min}-${franchise.breakevenMonths.max} months
Viability Score: ${franchise.viabilityScore}/100
Licenses Required: ${franchise.licenses?.join(', ')}
Setup Includes: ${franchise.setupIncludes?.join(', ')}`;

    const prompt = `
Franchise details:
${franchiseData}

User question: "${question || 'Tell me everything I need to know about this franchise as a first-time investor.'}"

Answer in simple, practical language a first-time entrepreneur in Chennai can understand.
Cover: what the business actually involves day-to-day, whether the numbers make sense,
what kind of person this suits, and what they should be careful about.
Be honest, not a sales pitch. Keep it under 200 words.`;

    const completion = await grok.chat.completions.create({
      model: 'grok-3-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.5,
    });

    res.json({
      success: true,
      explanation: completion.choices[0].message.content.trim(),
      franchise: { name: franchise.name, category: franchise.category }
    });
  } catch (err) {
    console.error('AI explain error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/chat — Multi-turn franchise chat
router.post('/chat', protect, async (req, res) => {
  try {
    const { messages, franchiseId } = req.body;

    let context = '';
    if (franchiseId) {
      const franchise = await Franchise.findById(franchiseId).lean();
      if (franchise) {
        context = `You are discussing the franchise: ${franchise.name} (${franchise.category}).
Investment: ₹${franchise.investment.min}-${franchise.investment.max} Lakhs.
Breakeven: ${franchise.breakevenMonths.min}-${franchise.breakevenMonths.max} months.
Beginner-friendly: ${franchise.beginnerFriendly}.
Zones: ${franchise.zones?.join(', ')}.`;
      }
    }

    const completion = await grok.chat.completions.create({
      model: 'grok-3-mini',
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\n${context}` },
        ...messages.slice(-8) // Keep last 8 messages for context window efficiency
      ],
      max_tokens: 350,
      temperature: 0.6,
    });

    res.json({
      success: true,
      reply: completion.choices[0].message.content.trim()
    });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/roadmap — Generate personalized next-step roadmap
router.post('/roadmap', protect, async (req, res) => {
  try {
    const { franchiseId, userProfile } = req.body;
    const franchise = await Franchise.findById(franchiseId).lean();
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });

    const prompt = `
Franchise chosen: ${franchise.name} (${franchise.category})
Investment needed: ₹${franchise.investment.min}-${franchise.investment.max} Lakhs
User experience: ${userProfile?.experience || 'none'}
User location zone: ${userProfile?.zones?.[0] || 'South Chennai'}

Create a practical 90-day roadmap for this person to launch this franchise in Chennai.
Return ONLY JSON in this format:
{
  "phases": [
    {
      "phase": 1,
      "title": "...",
      "duration": "Week 1-2",
      "tasks": ["task1", "task2", "task3"],
      "milestone": "..."
    }
  ],
  "estimatedCost": "₹X Lakhs",
  "licenses": ["license1"],
  "warningFlags": ["risk1", "risk2"]
}
No markdown, just JSON.`;

    const completion = await grok.chat.completions.create({
      model: 'grok-3-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    let rawText = completion.choices[0].message.content.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let roadmap;
    try { roadmap = JSON.parse(rawText); }
    catch {
      roadmap = {
        phases: [
          { phase: 1, title: "Research & Planning", duration: "Week 1-2", tasks: ["Contact franchisor", "Visit existing outlets", "Arrange finances"], milestone: "Decision confirmed" },
          { phase: 2, title: "Legal & Setup", duration: "Week 3-6", tasks: ["Sign agreement", "Register business", "Apply for licenses"], milestone: "Legal entity ready" },
          { phase: 3, title: "Launch", duration: "Week 7-12", tasks: ["Complete training", "Set up outlet", "Hire staff", "Soft launch"], milestone: "First customer served" }
        ],
        estimatedCost: `₹${franchise.investment.min}-${franchise.investment.max} Lakhs`,
        licenses: franchise.licenses || [],
        warningFlags: ["Verify franchise agreement with a lawyer", "Check local competition density"]
      };
    }

    res.json({ success: true, roadmap, franchise: { name: franchise.name, category: franchise.category } });
  } catch (err) {
    console.error('AI roadmap error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/compare — AI-powered comparison of 2 franchises
router.post('/compare', protect, async (req, res) => {
  try {
    const { franchiseIdA, franchiseIdB, userProfile } = req.body;
    const [a, b] = await Promise.all([
      Franchise.findById(franchiseIdA).lean(),
      Franchise.findById(franchiseIdB).lean()
    ]);
    if (!a || !b) return res.status(404).json({ success: false, message: 'Franchise not found' });

    const prompt = `
Compare these two franchises for a seeker with profile: ${JSON.stringify(userProfile || {})}

Franchise A: ${a.name}
- Investment: ₹${a.investment.min}-${a.investment.max}L | Breakeven: ${a.breakevenMonths.max} months
- Royalty: ${a.royaltyLevel} | Beginner: ${a.beginnerFriendly} | Score: ${a.viabilityScore}

Franchise B: ${b.name}
- Investment: ₹${b.investment.min}-${b.investment.max}L | Breakeven: ${b.breakevenMonths.max} months
- Royalty: ${b.royaltyLevel} | Beginner: ${b.beginnerFriendly} | Score: ${b.viabilityScore}

Return JSON:
{
  "winner": "A or B or Tie",
  "winnerName": "...",
  "summary": "2 sentences why",
  "aStrengths": ["...", "..."],
  "bStrengths": ["...", "..."],
  "recommendation": "plain English advice under 100 words"
}`;

    const completion = await grok.chat.completions.create({
      model: 'grok-3-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3,
    });

    let rawText = completion.choices[0].message.content.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let comparison;
    try { comparison = JSON.parse(rawText); }
    catch { comparison = { winner: 'Tie', summary: 'Both franchises have merit.', recommendation: 'Compare based on your location and budget preference.' }; }

    res.json({ success: true, comparison, franchiseA: a, franchiseB: b });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
