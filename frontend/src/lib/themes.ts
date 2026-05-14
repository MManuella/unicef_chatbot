import { HealthTheme } from "./types";

export const HEALTH_THEMES: HealthTheme[] = [
  {
    id: "vih_sida",
    name: "VIH / SIDA",
    icon: "mdi:virus",
    color: "#e74c3c",
    description:
      "Informations sur le VIH/SIDA : transmission, prévention, dépistage et vie avec le virus.",
    suggestedQuestions: [
      "Comment se transmet le VIH ?",
      "Comment me faire dépister pour le VIH ?",
      "Qu'est-ce que la PrEP et comment fonctionne-t-elle ?",
      "Quels sont les symptômes du VIH ?",
      "Quelle est la différence entre le VIH et le SIDA ?",
    ],
  },
  {
    id: "sante_reproductive",
    name: "Santé reproductive",
    icon: "mdi:human-pregnant",
    color: "#e91e8c",
    description:
      "Contraception, planification familiale, grossesse et droits en matière de santé reproductive.",
    suggestedQuestions: [
      "Quels sont les différents moyens de contraception ?",
      "Comment fonctionne la contraception d'urgence ?",
      "À quel âge peut-on consulter un gynécologue ?",
      "Qu'est-ce que la planification familiale ?",
      "Comment détecter précocement une grossesse non désirée ?",
    ],
  },
  {
    id: "hygiene_menstruelle",
    name: "Hygiène menstruelle",
    icon: "mdi:water-circle",
    color: "#d63384",
    description:
      "Gestion de l'hygiène menstruelle, produits disponibles, tabous et droits des jeunes filles.",
    suggestedQuestions: [
      "Quels produits peut-on utiliser pendant les règles ?",
      "Comment gérer les douleurs menstruelles ?",
      "Est-il normal d'avoir des cycles irréguliers ?",
      "Comment parler des règles sans tabou ?",
      "Quelles sont les bonnes pratiques d'hygiène pendant les règles ?",
    ],
  },
  {
    id: "sante_mentale",
    name: "Santé mentale",
    icon: "mdi:brain",
    color: "#9b59b6",
    description:
      "Bien-être mental, stress, anxiété, dépression et ressources de soutien psychologique.",
    suggestedQuestions: [
      "Quels sont les signes de la dépression ?",
      "Comment gérer le stress et l'anxiété au quotidien ?",
      "Où trouver un soutien psychologique près de chez moi ?",
      "Comment aider un ami qui souffre mentalement ?",
      "Qu'est-ce que le burn-out et comment l'éviter ?",
    ],
  },
  {
    id: "ist",
    name: "IST",
    icon: "mdi:shield-alert",
    color: "#e67e22",
    description:
      "Infections sexuellement transmissibles : types, symptômes, prévention et traitement.",
    suggestedQuestions: [
      "Quelles sont les IST les plus courantes chez les jeunes ?",
      "Comment se protéger efficacement contre les IST ?",
      "Peut-on avoir une IST sans le savoir ?",
      "À quelle fréquence dois-je me faire dépister ?",
      "Les IST peuvent-elles être guéries complètement ?",
    ],
  },
  {
    id: "epidemie",
    name: "Conseils pratiques épidémies",
    icon: "mdi:biohazard",
    color: "#f39c12",
    description:
      "Prévention et gestion des épidémies : comportements à adopter, gestes barrières et ressources.",
    suggestedQuestions: [
      "Quels gestes adopter lors d'une épidémie ?",
      "Comment reconnaître les symptômes d'une maladie épidémique ?",
      "Comment protéger sa famille pendant une épidémie ?",
      "Où se faire soigner en cas d'épidémie dans ma région ?",
      "Quelle est la différence entre épidémie et pandémie ?",
    ],
  },
];

export const getThemeById = (id: string): HealthTheme | undefined =>
  HEALTH_THEMES.find((t) => t.id === id);
