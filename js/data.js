/* Golden Eagle Academy — Datos de demostración
   Exámenes, preguntas y perfil del estudiante.
   (Los datos se almacenan localmente; en una versión real vendrían de una API.) */

window.GE_DATA = {
  student: {
    name: "Jameson Smith",
    role: "Advanced Learner",
    level: "B2 Upper Int.",
    levelProgress: 75,
    levelTarget: "C1",
    hoursStudied: 142,
    averageScore: 88,
    listening: 92,
    reading: 84,
    streak: 5,
    goal: "IELTS Band 7.5",
    goalProgress: 68,
    avatar:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16305e"/><stop offset="1" stop-color="#091731"/></linearGradient></defs><rect width="84" height="84" fill="url(#g)"/><circle cx="42" cy="33" r="16" fill="#FBB900"/><path d="M14 78c0-16 13-26 28-26s28 10 28 26" fill="#FBB900"/></svg>'
      ),
  },

  recentActivity: [
    { icon: "headphones", tint: "#0d1b35", title: "Listening Practice: TED Talk", when: "Completado hace 2 días", score: "Score: 9/10" },
    { icon: "pencil", tint: "#3a2a10", title: "Writing Task 1: Bar Charts", when: "Completado hace 4 días", score: "Band 7.0" },
    { icon: "speaker", tint: "#FBB900", tintText: "#091731", title: "Speaking Mock Interview", when: "Completado hace 1 semana", score: "Band 7.5" },
  ],

  focusResources: [
    { icon: "book", title: "Academic Word List…", sub: "Flashcards & Quiz" },
    { icon: "play", title: "Mastering Complex …", sub: "Video Lesson (12m)" },
  ],

  levels: ["A1 Beginner", "A2 Elementary", "B1 Intermediate", "B2 Upper Intermediate", "C1 Advanced"],

  exams: [
    {
      id: "b2-practice-1",
      title: "Practice Test 1: Complete Exam",
      level: "B2 Upper Intermediate",
      levelTag: "B2 First",
      badge: "gold",
      minutes: 90,
      dateBadge: { m: "OCT", d: "15" },
      difficulty: "Advanced",
      description: "Un simulacro completo que cubre las cuatro destrezas. Ideal para establecer tu nivel base.",
      skills: ["Reading", "Listening", "Writing", "Speaking"],
      featured: true,
      section: "Reading & Use of English",
      part: "Part 1: Multiple Choice Cloze",
      passage: {
        title: "The Future of Deep Sea Exploration",
        instruction: "Para las preguntas 1-8, lee el texto y decide qué respuesta encaja mejor en cada espacio.",
        paragraphs: [
          "For centuries, the ocean depths have remained an enigma, a realm as inaccessible as the distant stars. However, recent technological advancements have {{1}} a new era of underwater discovery. Autonomous underwater vehicles (AUVs), equipped with highly sensitive sonar and high-definition cameras, are now capable of mapping the seafloor with unprecedented detail.",
          "These sophisticated machines navigate treacherous trenches and hydrothermal vents, environments characterized by crushing pressure and absolute darkness. They collect crucial data that is fundamentally changing our understanding of marine ecosystems and geological processes. Scientists are particularly {{2}} in the unique life forms that thrive in these extreme conditions, relying on chemosynthesis rather than photosynthesis for survival.",
          "Despite these leaps forward, the ocean remains largely uncharted territory. The vastness of the abyssal plain means that only a tiny fraction has been explored. As the demand for resources grows, so does the interest in deep-sea mining. This raises critical questions about environmental {{3}} and the potential impact on fragile deep-sea habitats.",
        ],
      },
      questions: [
        { id: 1, gap: 1, prompt: "Selecciona la opción correcta para el espacio (1):", options: ["instigated", "ushered in", "precipitated", "commenced"], answer: 1, explanation: "‘Ushered in’ es un phrasal verb que significa marcar el comienzo de un periodo o cambio, que encaja con ‘a new era’." },
        { id: 2, gap: 2, prompt: "Selecciona la opción correcta para el espacio (2):", options: ["interested", "attracted", "keen", "fascinated"], answer: 0, explanation: "‘Interested in’ es la colocación correcta con la preposición ‘in’ para expresar interés." },
        { id: 3, gap: 3, prompt: "Selecciona la opción correcta para el espacio (3):", options: ["sustain", "sustainably", "sustainability", "sustainable"], answer: 2, explanation: "Se necesita un sustantivo tras ‘environmental’; ‘sustainability’ es el sustantivo correcto." },
        { id: 4, prompt: "Choose the best synonym for ‘treacherous’ as used in the text:", options: ["reliable", "dangerous", "shallow", "colourful"], answer: 1, explanation: "‘Treacherous’ describe entornos peligrosos e impredecibles." },
        { id: 5, prompt: "According to the text, AUVs rely on which technologies to map the seafloor?", options: ["Radar and GPS", "Sonar and high-definition cameras", "Satellites", "Thermal drones"], answer: 1, explanation: "El texto menciona explícitamente ‘sonar and high-definition cameras’." },
        { id: 6, prompt: "The life forms in extreme depths survive through:", options: ["photosynthesis", "chemosynthesis", "hibernation", "migration"], answer: 1, explanation: "El pasaje indica que dependen de la quimiosíntesis en lugar de la fotosíntesis." },
        { id: 7, prompt: "What concern does deep-sea mining raise?", options: ["Cost of fuel", "Impact on fragile habitats", "Lack of minerals", "Tourism"], answer: 1, explanation: "El texto plantea preguntas sobre el impacto en frágiles hábitats de aguas profundas." },
        { id: 8, prompt: "The tone of the passage is best described as:", options: ["dismissive", "informative and cautious", "humorous", "nostalgic"], answer: 1, explanation: "El texto informa sobre avances mientras advierte sobre riesgos ambientales." },
      ],
    },
    {
      id: "b2-use-english",
      title: "Use of English: Part 1-4",
      level: "B2 Upper Intermediate",
      levelTag: "B2 First",
      badge: "gold",
      minutes: 45,
      dateBadge: { m: "OCT", d: "28" },
      difficulty: "B2",
      description: "Práctica dirigida centrada específicamente en gramática y vocabulario…",
      skills: ["Reading & Use of English"],
      section: "Use of English",
      part: "Part 2: Open Cloze",
      passage: {
        title: "The Art of Storytelling",
        instruction: "Para las preguntas 1-6, lee el texto y decide qué palabra encaja mejor en cada espacio.",
        paragraphs: [
          "Storytelling is one of the oldest forms of human communication. Long {{1}} written language existed, our ancestors gathered around fires to share tales of adventure and caution. These stories were not merely entertainment; they {{2}} as vessels for cultural knowledge and moral lessons.",
          "Today, {{3}} the medium has evolved from spoken word to film and interactive media, the fundamental purpose remains {{4}} the same. A compelling narrative can transport an audience, evoke deep emotion, and shape the way we perceive the world around us.",
        ],
      },
      questions: [
        { id: 1, gap: 1, prompt: "Escribe/selecciona la palabra correcta para el espacio (1):", options: ["before", "after", "since", "while"], answer: 0, explanation: "‘Long before’ indica un momento muy anterior a la escritura." },
        { id: 2, gap: 2, prompt: "Selecciona la palabra correcta para el espacio (2):", options: ["worked", "served", "acted", "made"], answer: 1, explanation: "‘Served as’ significa funcionar como algo (vessels of knowledge)." },
        { id: 3, gap: 3, prompt: "Selecciona la palabra correcta para el espacio (3):", options: ["although", "despite", "however", "because"], answer: 0, explanation: "‘Although’ introduce una cláusula de contraste con verbo." },
        { id: 4, prompt: "Selecciona la palabra correcta para el espacio (4):", options: ["largely", "hardly", "rarely", "barely"], answer: 0, explanation: "‘Largely the same’ = en gran medida igual." },
        { id: 5, prompt: "The word ‘compelling’ most nearly means:", options: ["boring", "captivating", "confusing", "brief"], answer: 1, explanation: "‘Compelling’ significa cautivador, que atrae la atención." },
        { id: 6, prompt: "The main idea of the passage is that storytelling:", options: ["is outdated", "has a lasting, evolving purpose", "is only entertainment", "requires writing"], answer: 1, explanation: "El texto sostiene que el propósito perdura aunque cambie el medio." },
      ],
    },
    {
      id: "c1-advanced-a",
      title: "Advanced Practice Test A",
      level: "C1 Advanced",
      levelTag: "C1 Advanced",
      badge: "brown",
      minutes: 120,
      dateBadge: { m: "NOV", d: "05" },
      difficulty: "C1",
      description: "Simulación rigurosa de la examinación C1 Advanced.",
      skills: ["Reading", "Listening", "Writing", "Speaking"],
      section: "Reading & Use of English",
      part: "Part 1: Multiple Choice Cloze",
      passage: {
        title: "The Paradox of Choice",
        instruction: "Para las preguntas 1-6, lee el texto y decide qué respuesta encaja mejor en cada espacio.",
        paragraphs: [
          "In affluent societies, consumers are {{1}} with an overwhelming array of options. While a degree of choice is undeniably empowering, an excess can be paralysing. Psychologists have {{2}} that beyond a certain threshold, additional options breed anxiety rather than satisfaction.",
          "This phenomenon, often {{3}} to as the paradox of choice, suggests that the modern pursuit of endless customisation may {{4}} undermine our well-being, leaving us perpetually wondering whether a better alternative was overlooked.",
        ],
      },
      questions: [
        { id: 1, gap: 1, prompt: "Selecciona la opción correcta para el espacio (1):", options: ["confronted", "opposed", "resisted", "declined"], answer: 0, explanation: "‘Confronted with’ = enfrentado a una gran cantidad de opciones." },
        { id: 2, gap: 2, prompt: "Selecciona la opción correcta para el espacio (2):", options: ["demonstrated", "pretended", "refused", "guessed"], answer: 0, explanation: "‘Demonstrated’ = han demostrado con evidencia." },
        { id: 3, gap: 3, prompt: "Selecciona la opción correcta para el espacio (3):", options: ["referred", "pointed", "called", "named"], answer: 0, explanation: "‘Referred to as’ es la forma correcta para nombrar un fenómeno." },
        { id: 4, prompt: "Selecciona la opción correcta para el espacio (4):", options: ["paradoxically", "obviously", "rarely", "loudly"], answer: 0, explanation: "‘Paradoxically’ refuerza la idea de la paradoja de la elección." },
        { id: 5, prompt: "The phrase ‘breed anxiety’ suggests options can:", options: ["reduce stress", "create worry", "save money", "improve focus"], answer: 1, explanation: "‘Breed anxiety’ significa generar ansiedad." },
        { id: 6, prompt: "The author’s overall stance on excessive choice is:", options: ["strongly positive", "critical/cautionary", "indifferent", "humorous"], answer: 1, explanation: "El autor advierte que el exceso de opciones puede perjudicar el bienestar." },
      ],
    },
  ],

  /* Resultado de ejemplo mostrado en la pantalla de resultados si no hay intentos reales. */
  sampleResult: {
    examTitle: "B2 Upper Intermediate Final",
    date: "Oct 24, 2023",
    percent: 82,
    verdict: "Pass (Merit)",
    passing: 60,
    feedback:
      "Excellent performance, Jameson. You demonstrated strong comprehension in listening and reading. Your grasp of complex grammatical structures has improved significantly since your last assessment.",
    focusAreas: [
      "Review <b>mixed conditionals</b> to improve writing fluency.",
      "Expand vocabulary related to <b>academic phrasal verbs</b> (e.g. ‘look into’, ‘carry out’).",
    ],
    status: "Ready for C1 Advanced preparation.",
    skills: [
      { name: "Listening", icon: "headphones", pct: 95, filled: 4, gold: true, desc: "Exceptional comprehension of native accents." },
      { name: "Reading", icon: "book", pct: 80, filled: 4, gold: true, desc: "Strong scanning skills, careful with inference." },
      { name: "Speaking", icon: "speaker", pct: 85, filled: 4, gold: true, desc: "Fluid delivery, minor hesitation on complex topics." },
      { name: "Writing", icon: "pencil", pct: 70, filled: 3, low: true, desc: "Good structure, needs richer vocabulary." },
    ],
    sections: [
      { name: "Reading Comprehension", pct: 80, active: true },
      { name: "Grammar & Vocabulary", pct: 75 },
      { name: "Listening Part 1", pct: 100 },
    ],
    correct: 16,
    incorrect: 4,
    review: [
      {
        correct: true,
        stem: "In paragraph 2, the author implies that the new policy will primarily affect…",
        options: ["Local business owners.", "Commuters using public transport.", "City council members."],
        answer: 1, chosen: 1,
      },
      {
        correct: false,
        stem: "Choose the correct word to complete the sentence: \"If she ______ earlier, she wouldn't have missed the train.\"",
        options: ["A. left", "B. had left (Correct Answer)", "C. has left (Your Answer)"],
        answer: 1, chosen: 2,
        explanation: "This is a Third Conditional sentence, which talks about an unreal past situation. The structure requires 'if' + past perfect (had left) in the condition clause.",
      },
      {
        correct: true,
        stem: "Which phrasal verb means 'to tolerate'?",
        options: ["A. put up with", "B. look forward to", "C. catch up on"],
        answer: 0, chosen: 0,
      },
    ],
  },
};
