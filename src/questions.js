/**
 * QUESTIONS.JS — Sample Question Bank
 * ─────────────────────────────────────────────────────────────────────────────
 * Designed by pio687 · Built by Claude Sonnet 4.6
 *
 * This is the DATA file. Swap this file to change quizzes.
 * The engine (QuizTemplate.jsx) does not need to be modified.
 *
 * STORAGE_KEY  — change this for each new quiz to avoid localStorage conflicts.
 * DECK_VERSION — bump this if you significantly restructure the question bank.
 * QUIZ_TITLE   — displayed in the header and results screen.
 * QUIZ_SUBJECT — displayed as the small label above the title.
 *
 * Leave any array empty ([]) if that question type is not used.
 * The engine will auto-detect which types are active and build the
 * round rotation accordingly.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUESTION TYPES REFERENCE
 * ─────────────────────────────────────────────────────────────────────────────
 * T/F:
 *   { id:"unique_id", topic:"Topic Name", type:"tf",
 *     question:"Statement here.", answer:true,
 *     explanation:"Why this is true/false." }
 *
 * Multiple Choice:
 *   { id:"unique_id", topic:"Topic Name", type:"mc",
 *     question:"Question here?",
 *     options:["Option A","Option B","Option C","Option D"],
 *     answer:0,
 *     explanation:"Why this is correct." }
 *   NOTE: If last option is "all of the above" style, it stays anchored last.
 *
 * Calculation:
 *   { id:"unique_id", topic:"Topic Name", type:"calc",
 *     question:"Context sentence.\n\nFormula: ...\n\nCalculate X. (Round to nearest whole number)",
 *     answer:50, tolerance:2, answerDisplay:"≈ 50%",
 *     explanation:"How to solve it." }
 *
 * Definition Match (MC-style, definition as question, terms as options):
 *   { id:"unique_id", topic:"Definitions", type:"def",
 *     question:"The definition text goes here as the question.",
 *     answer:"Correct Term",
 *     options:["Correct Term","Wrong Term A","Wrong Term B","Wrong Term C"],
 *     explanation:"Why this definition matches this term." }
 *
 * Ordering (goes in SPECIAL_QUESTIONS):
 *   { id:"ord_unique", topic:"Topic Name", type:"ordering",
 *     question:"Arrange these items in order from X to Y.",
 *     correctOrder:["First","Second","Third","Fourth","Fifth"],
 *     explanation:"Why this order is correct." }
 *
 * Matching (goes in SPECIAL_QUESTIONS):
 *   { id:"match_unique", topic:"Topic Name", type:"match",
 *     question:"Match each item with its correct description.",
 *     pairs:[
 *       { term:"Term A", desc:"Description of Term A" },
 *       { term:"Term B", desc:"Description of Term B" },
 *     ],
 *     explanation:"Summary of the correct matches." }
 */

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

export const STORAGE_KEY   = "sample_quiz_v1";
export const DECK_VERSION  = 1;
export const QUIZ_TITLE    = "Sample Quiz";
export const QUIZ_SUBJECT  = "General Knowledge";

export const PATCH_NOTES = `v2 Engine — March 28, 2026 · 2:30 AM
Refactored from monolithic single-file to split engine/data architecture.
Round slot rotation now auto-derives from populated question types — no
hardcoded rotation. Designed by pio687, built by Claude Sonnet 4.6.`;

// ─────────────────────────────────────────────────────────────────────────────
// TRUE / FALSE
// ─────────────────────────────────────────────────────────────────────────────

export const TF_QUESTIONS = [
  { id:"tf1", topic:"Science", type:"tf",
    question:"The sun is a star.",
    answer:true,
    explanation:"true — The sun is a medium-sized star at the center of our solar system." },

  { id:"tf2", topic:"Science", type:"tf",
    question:"Lightning never strikes the same place twice.",
    answer:false,
    explanation:"false — Lightning frequently strikes the same place multiple times. Tall structures like the Empire State Building are hit dozens of times per year." },

  { id:"tf3", topic:"History", type:"tf",
    question:"The Great Wall of China is visible from space with the naked eye.",
    answer:false,
    explanation:"false — This is a common myth. The wall is too narrow to be seen from low Earth orbit without aid, and astronauts have confirmed this." },

  { id:"tf4", topic:"Pop Culture", type:"tf",
    question:"In Monty Python and the Holy Grail, the airspeed velocity question specifies an African swallow.",
    answer:false,
    explanation:"false — The question asks about a swallow without specifying African or European. When the knight asks for clarification, the questioner is thrown into the gorge mid-sentence." },

  { id:"tf5", topic:"Science", type:"tf",
    question:"Humans share approximately 50% of their DNA with bananas.",
    answer:true,
    explanation:"true — About half of human genes have functional equivalents in bananas, reflecting shared fundamental cellular machinery." },

  { id:"tf6", topic:"History", type:"tf",
    question:"Napoleon Bonaparte was unusually short for his time.",
    answer:false,
    explanation:"false — Napoleon stood around 5'7\", which was average to slightly above average for a French man of his era. The 'short Napoleon' myth stems partly from British propaganda and a units confusion between French and English inches." },

  { id:"tf7", topic:"Science", type:"tf",
    question:"Eating polar bear liver can be fatal to humans.",
    answer:true,
    explanation:"true — Polar bear liver contains extraordinarily high concentrations of Vitamin A (retinol). A single serving can cause hypervitaminosis A, leading to severe symptoms including peeling skin, hair loss, and death. Arctic explorers learned this the hard way." },

  { id:"tf8", topic:"History", type:"tf",
    question:"Admiral Richard Byrd claimed to have flown over both the North and South Poles.",
    answer:true,
    explanation:"true — Byrd claimed to have flown over the North Pole in 1926 (though this has been disputed by some historians) and flew over the South Pole in 1929. He led five expeditions to Antarctica in total." },
];

// ─────────────────────────────────────────────────────────────────────────────
// MULTIPLE CHOICE
// ─────────────────────────────────────────────────────────────────────────────

export const MC_QUESTIONS = [
  { id:"mc1", topic:"Science", type:"mc",
    question:"What is the chemical symbol for gold?",
    options:["Go","Gd","Au","Ag"],
    answer:2,
    explanation:"Au comes from the Latin word 'aurum,' meaning gold." },

  { id:"mc2", topic:"Geography", type:"mc",
    question:"What is the capital of Australia?",
    options:["Sydney","Melbourne","Brisbane","Canberra"],
    answer:3,
    explanation:"Canberra is the capital. Sydney and Melbourne both wanted the title, so Canberra was purpose-built as a compromise between them." },

  { id:"mc3", topic:"Pop Culture", type:"mc",
    question:"What is the favorite color of the Knights Who Say Ni?",
    options:["Blue","Red","It is a herring","They don't have one — they want a shrubbery"],
    answer:3,
    explanation:"The Knights Who Say Ni demand a shrubbery, not a color. The favorite color question comes from the Bridge of Death scene with a different character." },

  { id:"mc4", topic:"Geography", type:"mc",
    question:"Which of these is NOT one of the Great Lakes?",
    options:["Lake Huron","Lake Champlain","Lake Erie","Lake Ontario"],
    answer:1,
    explanation:"Lake Champlain sits on the New York/Vermont/Quebec border. The Great Lakes are Huron, Ontario, Michigan, Erie, and Superior — remembered by the acronym HOMES." },

  { id:"mc6", topic:"History", type:"mc",
    question:"In 1947, Grace Hopper's team found the world's first computer \"bug\" inside a Harvard Mark II computer. What was it?",
    options:["A moth","John Lennon","A bit flip","A frayed wire"],
    answer:0,
    explanation:"A moth was found trapped in a relay and taped into the logbook with the note 'First actual case of bug being found.' The log is preserved at the Smithsonian. A John Lennon and a bit flip were not involved." },

  { id:"mc7", topic:"Science", type:"mc",
    question:"What is the closest living relative of Tyrannosaurus rex?",
    options:["Crocodilians","Komodo dragons","Chickens and other birds","Lizards"],
    answer:2,
    explanation:"Birds are the direct descendants of theropod dinosaurs, the group that includes T. rex. Soft tissue analysis of T. rex fossils has confirmed closer protein similarities to chickens and ostriches than to any reptile." },

  // Integrative — tagged topic:"Integrative" so the engine slots it correctly
  { id:"mc5", topic:"Integrative", type:"mc",
    question:"According to The Hitchhiker's Guide to the Galaxy, what two words are printed in large friendly letters on the cover of the Guide?",
    options:["Don't Panic","Mostly Harmless","So Long","42"],
    answer:0,
    explanation:"'Don't Panic' is printed on the cover of the Hitchhiker's Guide in large friendly letters. Douglas Adams considered it to be the most useful advice the Guide had to offer." },
];

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

export const CALC_QUESTIONS = [
  { id:"calc1", topic:"Science", type:"calc",
    question:"A standard donut contains about 300 calories. You eat 4 donuts.\n\nTotal Calories = Donuts × Calories Per Donut\n\nDonuts = 4\nCalories Per Donut = 300\n\nCalculate the total calories. (Round to nearest whole number)",
    answer:1200, tolerance:0, answerDisplay:"1200 calories",
    explanation:"4 × 300 = 1200 calories. For reference, that's roughly half the recommended daily intake for an adult. Worth it." },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEFINITION MATCH
// ─────────────────────────────────────────────────────────────────────────────

export const DEFINITION_QUESTIONS = [
  { id:"def1", topic:"Definitions", type:"def",
    question:"A logical fallacy where someone dismisses a claim by attacking the person making it rather than addressing the argument itself.",
    answer:"Ad Hominem",
    options:["Ad Hominem","Straw Man","False Dichotomy","Begging the Question"],
    explanation:"Ad hominem is Latin for 'to the person.' It's a fallacy because a person's character is irrelevant to whether their argument is logically sound." },
];

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL — ORDERING & MATCHING
// ─────────────────────────────────────────────────────────────────────────────

export const SPECIAL_QUESTIONS = [
  { id:"ord1", topic:"Science", type:"ordering",
    question:"Arrange the planets of the solar system in order from closest to farthest from the sun.",
    correctOrder:["Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune"],
    explanation:"My Very Educated Mother Just Served Us Nachos — Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune." },

  { id:"match1", topic:"Pop Culture", type:"match",
    question:"Match each actor to their most iconic sci-fi or fantasy role.",
    pairs:[
      { term:"Keanu Reeves",     desc:"Neo — The Matrix" },
      { term:"Elijah Wood",      desc:"Frodo Baggins — The Lord of the Rings" },
      { term:"Daisy Ridley",     desc:"Rey — Star Wars: The Force Awakens" },
      { term:"Daniel Radcliffe", desc:"Harry Potter" },
    ],
    explanation:"Keanu = Neo, Elijah Wood = Frodo, Daisy Ridley = Rey, Daniel Radcliffe = Harry Potter." },
];
