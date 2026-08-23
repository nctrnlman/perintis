import type { ComponentType } from "react";
import { Globe, Mail, MessageCircle } from "lucide-react";
import { GithubIcon, InstagramIcon, LinkedinIcon } from "@/components/layout/brand-icons";

export interface DeveloperLink {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}

export const DEVELOPER_LINKS: DeveloperLink[] = [
  { href: "https://rhazes-labs.vercel.app/", icon: Globe, label: "Website" },
  { href: "https://github.com/rhazes", icon: GithubIcon, label: "GitHub" },
  { href: "https://linkedin.com/in/rhazes", icon: LinkedinIcon, label: "LinkedIn" },
  { href: "https://www.instagram.com/rhazes.d/", icon: InstagramIcon, label: "Instagram" },
  { href: "https://wa.me/6281221431716", icon: MessageCircle, label: "WhatsApp" },
  { href: "mailto:rhazesd@gmail.com", icon: Mail, label: "Email" },
];
