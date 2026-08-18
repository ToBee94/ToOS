// Brand marks for tech-stack chips (simple-icons, single-path 24×24). A skill
// that has no brand icon here just renders as a plain mono chip, so real
// tech-stack lists can be dropped in verbatim. Consumers can pass their own
// icon map instead if `simple-icons` isn't a dependency they want.
import {
  siPhp, siSymfony, siTypescript, siJavascript, siPython, siReact,
  siMysql, siRedis, siElasticsearch, siDocker, siKubernetes, siLinux,
  siGit, siGitlab, siJira, siTypo3, siHtml5, siCss, siJenkins, siAnsible,
  siCplusplus, siC, siWordpress,
  siVuedotjs, siFlutter, siDrupal, siAndroid, siApple,
  siWireguard, siProxmox, siAuthentik, siLinuxcontainers,
} from "simple-icons";

export type Icon = { hex: string; path: string };

export const ICONS: Record<string, Icon> = {
  PHP: siPhp,
  Symfony: siSymfony,
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  Python: siPython,
  React: siReact,
  MySQL: siMysql,
  Redis: siRedis,
  Elasticsearch: siElasticsearch,
  Docker: siDocker,
  Kubernetes: siKubernetes,
  Linux: siLinux,
  Git: siGit,
  GitLab: siGitlab,
  Jira: siJira,
  TYPO3: siTypo3,
  HTML5: siHtml5,
  CSS: siCss,
  Jenkins: siJenkins,
  Ansible: siAnsible,
  "C++": siCplusplus,
  C: siC,
  WordPress: siWordpress,
  "Vue.js": siVuedotjs,
  Flutter: siFlutter,
  Drupal: siDrupal,
  Android: siAndroid,
  iOS: siApple,
  WireGuard: siWireguard,
  Proxmox: siProxmox,
  Authentik: siAuthentik,
  LXC: siLinuxcontainers,
};

/** Brand colour, lightened when near-black so it stays legible on the dark UI. */
export function techColor(hex: string): string {
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 45 ? "#c9d1d9" : `#${hex}`;
}
