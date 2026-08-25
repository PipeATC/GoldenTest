/* Golden Eagle Academy — Aviation English (ICAO) demo data
   Modules Aviation 101 / 102 / 103, mapped to ICAO Language Proficiency levels.
   (Stored locally for the demo; a production build would load these from an API.) */

window.GE_DATA = {
  student: {
    name: "Jameson Smith",
    role: "Pilot · ICAO Level 4",
    level: "ICAO Level 4",
    levelProgress: 70,
    levelTarget: "Level 6",
    hoursStudied: 142,
    averageScore: 88,
    comprehension: 92,
    fluency: 84,
    streak: 5,
    goal: "ICAO Level 6",
    goalProgress: 68,
    avatar:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16305e"/><stop offset="1" stop-color="#091731"/></linearGradient></defs><rect width="84" height="84" fill="url(#g)"/><circle cx="42" cy="33" r="16" fill="#FBB900"/><path d="M14 78c0-16 13-26 28-26s28 10 28 26" fill="#FBB900"/></svg>'
      ),
  },

  recentActivity: [
    { icon: "headphones", tint: "#0d1b35", title: "Radio Check: Departure Clearance", when: "Completed 2 days ago", score: "Score: 9/10" },
    { icon: "pencil", tint: "#3a2a10", title: "Position Reporting Drill", when: "Completed 4 days ago", score: "ICAO L4" },
    { icon: "speaker", tint: "#FBB900", tintText: "#091731", title: "Emergency Call Simulation", when: "Completed 1 week ago", score: "ICAO L5" },
  ],

  focusResources: [
    { icon: "book", title: "Standard Phraseology Deck", sub: "Flashcards & Quiz" },
    { icon: "play", title: "Reading Back Clearances", sub: "Video Lesson (12m)" },
  ],

  /* ICAO Language Proficiency Rating Scale levels used to group the library. */
  levels: [
    "ICAO Level 2 — Elementary",
    "ICAO Level 3 — Pre-Operational",
    "ICAO Level 4 — Operational",
    "ICAO Level 5 — Extended",
    "ICAO Level 6 — Expert",
  ],

  exams: [
    {
      id: "aviation-101",
      title: "Aviation 101 · Radiotelephony Foundations",
      module: "Aviation 101",
      level: "ICAO Level 3 — Pre-Operational",
      levelTag: "ICAO 3–4",
      badge: "gold",
      minutes: 45,
      dateBadge: { m: "OCT", d: "15" },
      difficulty: "Level 3 → 4",
      description: "Master the ICAO phonetic alphabet, number pronunciation and standard phraseology — the building blocks of clear pilot–controller communication.",
      skills: ["Phraseology", "Comprehension", "Vocabulary", "Readback"],
      featured: true,
      section: "Radiotelephony & Standard Phraseology",
      part: "Part 1: Standard Words & Phraseology",
      passage: {
        title: "Why Standard Phraseology Matters",
        instruction: "For questions 1–8, read the text and decide which answer best fits each gap.",
        paragraphs: [
          "Standard phraseology is the {{1}} of safe radiotelephony. Because pilots and controllers of many nationalities share the same frequency, they must rely on a {{2}} set of words and phrases whose meaning is fixed and unambiguous. Using everyday conversational English on the radio increases the risk of misunderstanding, especially when transmissions are short or the frequency is congested.",
          "The ICAO phonetic alphabet — Alfa, Bravo, Charlie, and so on — exists so that individual letters are never confused. In the same way, numbers are pronounced in a distinctive manner: three becomes “TREE”, nine becomes “NINER”, and the decimal point is spoken as “DECIMAL”. These conventions protect clarity even over a poor-quality signal.",
          "To confirm that a message has been received correctly, controllers frequently require a {{3}}. When a pilot is unsure of any instruction, the correct action is never to guess but to ask the controller to “SAY AGAIN”. Discipline in these small habits is what keeps communication safe.",
        ],
      },
      questions: [
        { id: 1, gap: 1, prompt: "Select the correct option for gap (1):", options: ["foundation", "decoration", "obstacle", "delay"], answer: 0, explanation: "Standard phraseology is described as the basis, or foundation, of safe communication." },
        { id: 2, gap: 2, prompt: "Select the correct option for gap (2):", options: ["standardised", "personal", "random", "lengthy"], answer: 0, explanation: "A shared, fixed vocabulary is a standardised set of words and phrases." },
        { id: 3, gap: 3, prompt: "Select the correct option for gap (3):", options: ["readback", "silence", "shortcut", "handover"], answer: 0, explanation: "A readback lets the controller verify the message was received correctly." },
        { id: 4, prompt: "Which word represents the letter “R” in the ICAO phonetic alphabet?", options: ["Romeo", "Roger", "Rescue", "Radar"], answer: 0, explanation: "“Romeo” is the ICAO phonetic word for the letter R. “Roger” means the message was received." },
        { id: 5, prompt: "The procedure word “WILCO” means:", options: ["Will comply", "Wait for clearance", "Wind and cloud", "Wrong locator"], answer: 0, explanation: "“WILCO” is short for “will comply” — the pilot understands and will act on the instruction." },
        { id: 6, prompt: "Which reply correctly acknowledges that a message has been received and understood?", options: ["ROGER", "STANDBY", "NEGATIVE", "BREAK"], answer: 0, explanation: "“ROGER” means the transmission was received. “STANDBY” means wait; “NEGATIVE” means no." },
        { id: 7, prompt: "In aviation radiotelephony, the number 3 is pronounced:", options: ["TREE", "THIRD", "TRES", "THREE-ER"], answer: 0, explanation: "To avoid confusion, ICAO prescribes “TREE” for the number 3 and “NINER” for 9." },
        { id: 8, prompt: "The procedure word “AFFIRM” is used to say:", options: ["Yes", "No", "Maybe", "Repeat"], answer: 0, explanation: "“AFFIRM” means yes; the opposite is “NEGATIVE”." },
      ],
    },
    {
      id: "aviation-102",
      title: "Aviation 102 · Operational Communications",
      module: "Aviation 102",
      level: "ICAO Level 4 — Operational",
      levelTag: "ICAO 4",
      badge: "gold",
      minutes: 60,
      dateBadge: { m: "OCT", d: "28" },
      difficulty: "Level 4",
      description: "Handle clearances, position reports and aerodrome weather in controlled airspace at ICAO Operational Level 4.",
      skills: ["Structure", "Comprehension", "Interactions"],
      section: "Controlled Airspace Communications",
      part: "Part 2: Clearances, Position Reports & Weather",
      passage: {
        title: "Operating in Controlled Airspace",
        instruction: "For questions 1–8, read the text and decide which answer best fits each gap.",
        paragraphs: [
          "Before entering controlled airspace, a pilot must obtain a {{1}} from air traffic control. This authorisation specifies the route, level and any restrictions the flight must follow. Crucially, an ATC clearance is not an instruction to take off or enter a runway; separate wording is always used for those actions.",
          "Accurate altitude depends on the correct altimeter setting. The pressure value referenced to mean sea level, known as {{2}}, is passed by the controller and set by the pilot so that reported altitudes agree with those seen on the ground. Above the transition altitude, aircraft instead use the standard setting and report flight levels.",
          "At defined reporting points, or when requested, pilots transmit a {{3}} report: callsign, position, time and level. Every clearance that affects the safety of the flight — a runway assignment, a level change, a heading — must be read back so the controller can confirm it was correctly received.",
        ],
      },
      questions: [
        { id: 1, gap: 1, prompt: "Select the correct option for gap (1):", options: ["clearance", "ticket", "logbook", "licence"], answer: 0, explanation: "Air traffic control issues a clearance authorising the flight’s route and level." },
        { id: 2, gap: 2, prompt: "Select the correct option for gap (2):", options: ["QNH", "RVR", "ETA", "POB"], answer: 0, explanation: "QNH is the altimeter setting referenced to mean sea level. RVR is runway visual range; POB is persons on board." },
        { id: 3, gap: 3, prompt: "Select the correct option for gap (3):", options: ["position", "weight", "passenger", "fuel-brand"], answer: 0, explanation: "A position report contains callsign, position, time and level." },
        { id: 4, prompt: "A METAR is:", options: ["A routine aerodrome weather report", "A flight plan", "A distress call", "A navigation chart"], answer: 0, explanation: "A METAR is a routine, regularly issued report of aerodrome weather conditions." },
        { id: 5, prompt: "In a weather report, “CAVOK” means:", options: ["Ceiling and visibility OK", "Caution, adverse weather", "Cleared above via oceanic", "Cancel voice, keep silence"], answer: 0, explanation: "CAVOK indicates ceiling and visibility OK — good conditions with no significant weather." },
        { id: 6, prompt: "The surface wind is reported as “270 degrees, 15 knots”. This means the wind is:", options: ["Coming from 270°, at 15 knots", "Going towards 270°, at 15 knots", "270 knots from the west", "15 degrees, gusting 270"], answer: 0, explanation: "Wind direction is always given as the direction the wind is coming from, in degrees, with speed in knots." },
        { id: 7, prompt: "Reading back a runway assignment or level clearance is:", options: ["Mandatory", "Optional", "Only for IFR", "Discouraged"], answer: 0, explanation: "Safety-critical clearances such as runway and level assignments must always be read back." },
        { id: 8, prompt: "The instruction “Squawk 4521” refers to setting the:", options: ["Transponder code", "Radio frequency", "Altimeter", "Heading bug"], answer: 0, explanation: "“Squawk” refers to the transponder code entered by the crew." },
      ],
    },
    {
      id: "aviation-103",
      title: "Aviation 103 · Non-Routine & Emergencies",
      module: "Aviation 103",
      level: "ICAO Level 5 — Extended",
      levelTag: "ICAO 5–6",
      badge: "brown",
      minutes: 90,
      dateBadge: { m: "NOV", d: "05" },
      difficulty: "Level 5 → 6",
      description: "Manage emergencies and unexpected situations using plain language and distress/urgency phraseology at Extended and Expert level.",
      skills: ["Fluency", "Comprehension", "Interactions", "Vocabulary"],
      section: "Emergency & Non-Routine Communications",
      part: "Part 3: Plain Language & Emergency Phraseology",
      passage: {
        title: "When Things Do Not Go to Plan",
        instruction: "For questions 1–8, read the text and decide which answer best fits each gap.",
        paragraphs: [
          "Standard phraseology covers the great majority of exchanges, but it cannot describe every situation. When an aircraft is in {{1}} and imminent danger and requires immediate assistance, the pilot declares an emergency by transmitting the word {{2}} three times, followed by the nature of the problem, intentions and position.",
          "Not every abnormal situation is a distress. For a condition of urgency that concerns the safety of the aircraft or a person on board but does not require immediate assistance, the correct call is {{3}}, also spoken three times. Choosing the right category helps the controller allocate the right priority and resources.",
          "In both cases, once the situation exceeds what fixed phraseology can express, pilots and controllers switch to clear, plain language. The ability to negotiate an unexpected problem — to paraphrase, confirm understanding and manage a misunderstanding — is exactly what separates an Extended Level 5 speaker from an Operational Level 4 one, and an Expert Level 6 speaker handles it with ease under pressure.",
        ],
      },
      questions: [
        { id: 1, gap: 1, prompt: "Select the correct option for gap (1):", options: ["grave", "minor", "routine", "scheduled"], answer: 0, explanation: "A distress condition is one of grave and imminent danger requiring immediate assistance." },
        { id: 2, gap: 2, prompt: "Select the correct option for gap (2):", options: ["MAYDAY", "SECURITE", "ROGER", "WILCO"], answer: 0, explanation: "The distress signal is “MAYDAY”, transmitted three times." },
        { id: 3, gap: 3, prompt: "Select the correct option for gap (3):", options: ["PAN-PAN", "MAYDAY", "STANDBY", "ROGER"], answer: 0, explanation: "The urgency signal is “PAN-PAN”, used when the situation is serious but not an immediate distress." },
        { id: 4, prompt: "“MAYDAY” indicates a condition of:", options: ["Distress", "Urgency", "Routine traffic", "Radio check"], answer: 0, explanation: "MAYDAY signals distress — grave and imminent danger requiring immediate help." },
        { id: 5, prompt: "“PAN-PAN” indicates a condition of:", options: ["Urgency", "Distress", "Normal operations", "Frequency change"], answer: 0, explanation: "PAN-PAN signals urgency: safety is a concern but immediate assistance is not required." },
        { id: 6, prompt: "When standard phraseology cannot fully describe a situation, pilots should:", options: ["Use clear, plain language", "Stop transmitting", "Invent new codewords", "Switch to their native language"], answer: 0, explanation: "ICAO requires the use of plain language when standard phraseology is insufficient." },
        { id: 7, prompt: "A pilot who is unsure whether a clearance was understood correctly should:", options: ["Ask the controller to “SAY AGAIN”", "Comply and hope it is correct", "Ignore it", "Change frequency"], answer: 0, explanation: "Never guess — request “SAY AGAIN” to have the transmission repeated." },
        { id: 8, prompt: "Managing a misunderstanding by paraphrasing and confirming meaning best demonstrates the ICAO descriptor of:", options: ["Interactions", "Pronunciation", "Vocabulary", "Structure"], answer: 0, explanation: "Handling misunderstandings and negotiating meaning is assessed under the Interactions descriptor." },
      ],
    },
  ],

  /* Sample report shown as a preview when no real attempt exists yet. */
  sampleResult: {
    examTitle: "Aviation 102 · Operational Communications",
    date: "Oct 24, 2025",
    percent: 82,
    verdict: "ICAO Level 4 (Operational)",
    passing: 60,
  },
};
