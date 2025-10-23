"use client";
import Link from "next/link";

export default function ProjectsPage() {
  const projects = [
    { id: 1, name: "Content Organization", desc: "Systematically categorize and store notes.", scope: "All Projects", progress: 85 },
    { id: 2, name: "Task Automation", desc: "Automate repetitive tasks to save time.", scope: "Personal Tasks", progress: 60 },
    { id: 3, name: "Information Retrieval", desc: "Enhance search functionality for quick access.", scope: "All Areas", progress: 90 },
    { id: 4, name: "Idea Generation", desc: "Foster creativity and brainstorm new concepts.", scope: "Creative Team", progress: 70 },
    { id: 5, name: "User Experience Improvement", desc: "Refine interface for better user engagement.", scope: "All Users", progress: 75 },
    { id: 6, name: "Performance Tracking", desc: "Monitor usage statistics and user feedback.", scope: "Analytics", progress: 95 },
    { id: 7, name: "Collaboration Features", desc: "Enhance tools for team collaboration and sharing.", scope: "Team", progress: 80 },
    { id: 8, name: "System Integration", desc: "Integrate with other tools for seamless workflow.", scope: "All Systems", progress: 65 },
  ];

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>

      <div className="space-y-6">
        {projects.map((p) => (
          <div key={p.name} className="bg-gray-800 p-4 rounded-2xl flex justify-between items-center shadow">
            <div>
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className="text-sm text-gray-400">{p.desc}</p>
              <p className="text-xs mt-1 text-gray-500">{p.scope}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-2 bg-gray-700 rounded">
                <div className="h-2 bg-blue-500 rounded" style={{ width: `${p.progress}%` }} />
              </div>
              <Link
                href="/notes?tab=projects"
                className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2 rounded"
              >
                View insights
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}