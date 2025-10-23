import type { Activity, Note, Tag } from "./types";


export const activities: Activity[] = [
{ icon: "💡", title: "Research", desc: "Wrapped up a project milestone." },
{ icon: "✅", title: "Development", desc: "Refreshed docs and resources." },
{ icon: "📦", title: "Knowledge", desc: "Expanded your knowledge base." },
];


export const notes: Note[] = [
{
title: "Plans for home studio renovations",
desc: "I would like to contact David about the soundproof configurations for the wall since he…",
time: "5m ago",
},
{
title: "Atomic Habits summary",
desc: "James Clear talks in the first chapter about the importance of consistency over the year to ac…",
time: "2 hours ago",
},
{
title: "Tiramisu recipe",
desc: "Ingredients: 4 eggs, 250g of mascarpone, 25 boudoirs, Milk, cacao, amaretto (optional)…",
time: "2 hours ago",
},
];


export const tags: Tag[] = [
{ name: "Personal", emoji: "🧱" },
{ name: "Knowledge", emoji: "🧶" },
{ name: "Task Organizer", emoji: "🗿" },
];