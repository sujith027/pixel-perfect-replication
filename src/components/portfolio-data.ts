import dimensionThumbnail from "@/assets/Dimension Thumbnail.png";
import keyboardThumbnail from "@/assets/3D Keyboard Thumbnail.png";
import zentrixThumbnail from "@/assets/Zentrix Thumbnail.png";

export const EMAIL = "sujithspoojary274@gmail.com";
export const LINKEDIN = "https://www.linkedin.com/in/sujithspoojary/";
export const BEHANCE = "https://www.behance.net/sujithspoojary";

export const skills = ["User Research", "UI Design", "Interaction Design", "Wireframing", "Prototyping", "User Flows", "UX Audits", "Vibe Coding", "Design-to-Code"];
export const tools = [
  { name: "Figma", icon: "◆" },
  { name: "Miro", icon: "▲" },
  { name: "FigJam", icon: "●" },
  { name: "Visual Studio", icon: "◼" },
  { name: "Figma MCP", icon: "✦" },
];

export const projects = [
  { title: "Dimension", sub: "Immersive VR Experience Landing Page", desc: "An immersive landing page designed to make virtual reality feel bold, futuristic, and engaging.", tags: ["VR", "Landing Page", "3D"], grad: "bg-grad-sky", device: "laptop", image: dimensionThumbnail,
    detail: "An immersive landing page designed to make virtual reality feel bold, futuristic, and engaging." },
  { title: "Zentrix", sub: "Modern Glassmorphism Game Store UI", desc: "A sleek gaming interface combining glassmorphism, immersive visuals, and a modern dark aesthetic.", tags: ["Gaming", "Mobile UI", "Glassmorphism"], grad: "bg-grad-lime", device: "phone", image: zentrixThumbnail,
    detail: "A sleek gaming interface combining glassmorphism, immersive visuals, and a modern dark aesthetic." },
  { title: "Interactive 3D Keyboard", sub: "Experimental Interactive Web Experience", desc: "A playful interactive experience built around 3D visuals, keyboard interactions, and motion.", tags: ["Interactive", "3D", "Web Experience"], grad: "bg-grad-coral", device: "laptop", image: keyboardThumbnail,
    detail: "A playful interactive experience built around 3D visuals, keyboard interactions, and motion." },
];

export const moreProjects = [
  {
    number: "01",
    title: "Rilo",
    sub: "AI Companion",
    detail: "Designed an intuitive AI companion experience focused on making everyday interactions with AI feel simple and natural.",
    tags: ["AI", "Mobile", "UI/UX"],
    accent: "bg-grad-coral",
    href: "https://www.behance.net/gallery/231798123/Rilo-Your-Everyday-AI-Companion",
  },
  {
    number: "02",
    title: "Nova Design System",
    sub: "UI Design System",
    detail: "Built a flexible design system to bring consistency, scalability, and clarity across digital product experiences.",
    tags: ["Design System", "UI", "Components"],
    accent: "bg-grad-sky",
    href: "https://www.behance.net/gallery/234933613/Nova-Design-System-A-Modern-UI-Framework",
  },
  {
    number: "03",
    title: "LumoTrip",
    sub: "Travel Experience",
    detail: "Designed a travel companion that brings discovery, planning, and trip organization into one seamless experience.",
    tags: ["Travel", "Mobile", "UX"],
    accent: "bg-grad-lime",
    href: "https://www.behance.net/gallery/237561179/LumoTrip-Explore-Plan-Book-Your-Next-Adventure",
  },
];

export const behanceProjects = [
  { title: projects[0].title, sub: projects[0].sub, image: dimensionThumbnail, href: "https://www.behance.net/gallery/255379433/Dimension-Immersive-VR-Experience-Landing-Page" },
  { title: projects[1].title, sub: projects[1].sub, image: zentrixThumbnail, href: "https://www.behance.net/gallery/247456927/Zentrix-A-Modern-Glassmorphism-Game-Store-UI" },
  { title: projects[2].title, sub: projects[2].sub, image: keyboardThumbnail, href: "https://www.behance.net/gallery/222895159/Interactive-3D-Keyboard" },
];
