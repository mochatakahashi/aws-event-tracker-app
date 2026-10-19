/**
 * Up-to-date info for the club's existing events (descriptions, dates, venues,
 * co-organizers, expected participants, program flow, speakers and the Tech
 * Barangay sessions). Applied to the live database by an admin from Admin Home
 * ("Update event info"); the built-in sample events use it too.
 * Kept in sync with api/seed.ts (CLUB_EVENT_INFO).
 */
import type { ProgramRow } from '../types/event';

export interface ClubEventUpdate {
  id: string;
  /** Matches admin-made copies of the event by title (case-insensitive). */
  match: string;
  fields: Record<string, unknown> & { programFlow?: ProgramRow[] };
  sessions?: { id: string; title: string; startTime: string; endTime: string; speakerIds: string[]; description: string }[];
}

export const CLUB_EVENT_INFO: { version: number; speakers: { id: string; name: string; headline: string; company: string; bio: string; linkedInUrl?: string }[]; updates: ClubEventUpdate[] } = {
  "version": 4,
  "speakers": [
    {
      "id": "spk-wpm",
      "name": "WordPress Manila",
      "headline": "Co-organizer & Community Partner — WordPress Community speakers",
      "company": "WordPress Manila",
      "bio": "Morning block: Intro to WordPress, platform-agnostic hosting, a hands-on workshop, careers in WordPress and a community talk."
    },
    {
      "id": "spk-sbg-tech",
      "name": "AWS SBG-APC Technical Team",
      "headline": "Session 2: WordPress Integration on AWS",
      "company": "AWS Student Builder Group – APC",
      "bio": "Deploying WordPress to production on Amazon EC2, Amazon RDS and CloudFront."
    },
    {
      "id": "spk-notion",
      "name": "Notion Community Leads",
      "headline": "Session 3: Notion Productivity & Workspaces",
      "company": "Notion Community",
      "bio": "Workspace organization and developer productivity with Notion."
    },
    {
      "id": "spk-jlr",
      "name": "John Lexter Reyes",
      "headline": "Guest Speaker — AWS PUP Biñan Lead",
      "company": "",
      "bio": "Topic: Walkthrough AWS — a practical tour of the cloud landscape and the AWS ecosystem."
    },
    {
      "id": "spk-2",
      "name": "Rodmina Jhoy Ibe",
      "headline": "President, AWS SBG-APC",
      "company": "AWS SBG-APC",
      "bio": "",
      "linkedInUrl": "https://www.linkedin.com/in/rodmina-jhoy-ibe"
    },
    {
      "id": "spk-fa",
      "name": "Francis Anciro",
      "headline": "Technicals Assistant Director, AWS SBG-APC",
      "company": "AWS SBG-APC",
      "bio": ""
    },
    {
      "id": "spk-vna",
      "name": "Vince Nelmar Alobin",
      "headline": "Technicals Director, AWS SBG-APC",
      "company": "AWS SBG-APC",
      "bio": ""
    }
  ],
  "updates": [
    {
      "id": "evt-1",
      "match": "^tech barangay",
      "fields": {
        "description": "The Tech Barangay Summit is the flagship academic event closing SOCIT Fest 2026 — a full day that takes students from building a website to running it in the cloud and organizing their work around it.\n\nOrganized by AWS Student Builder Group – APC with the Junior Philippine Computer Society – APC, and WordPress Manila as co-organizer and community partner.\n\n• Morning — WordPress Manila: the open-source WordPress ecosystem, building a site from scratch, hosting concepts, a hands-on workshop and careers in WordPress.\n• Afternoon — AWS SBG-APC: putting WordPress into production on Amazon EC2, Amazon RDS and CloudFront.\n• Closing — Notion Community Leads: workspace organization and developer productivity with Notion.\n\nYou leave with practical skills and portfolio-ready work.\n\nObjectives\n• Bridge web content management, scalable cloud infrastructure and workspace systems in one industry-aligned masterclass.\n• Show a live production deployment of WordPress on Amazon EC2, Amazon RDS and CloudFront.\n• Teach workspace organization and developer productivity with Notion.",
        "venue": "MPH1, Comlab 204 & Comlab 206",
        "coOrganizers": [
          "Junior Philippine Computer Society – APC",
          "WordPress Manila"
        ],
        "startAt": "2026-11-14T07:00:00+08:00",
        "endAt": "2026-11-14T17:00:00+08:00",
        "participants": 130,
        "participantsEstimated": true,
        "capacity": 130,
        "speakerIds": [
          "spk-wpm",
          "spk-sbg-tech",
          "spk-notion"
        ],
        "programFlow": [
          {
            "time": "07:00 AM – 07:30 AM",
            "duration": "30 mins",
            "activity": "Ingress and Technical Setup",
            "personInCharge": "JPCS & AWS SBG Committees"
          },
          {
            "time": "07:30 AM – 07:50 AM",
            "duration": "20 mins",
            "activity": "Registration and Check-in of Attendees",
            "personInCharge": "Registration Team / Volunteers"
          },
          {
            "time": "07:50 AM – 08:00 AM",
            "duration": "10 mins",
            "activity": "Opening Remarks & Partner Introductions",
            "personInCharge": "Emcees / Hosts"
          },
          {
            "time": "08:00 AM – 08:35 AM",
            "duration": "35 mins",
            "activity": "Intro to WordPress (Basics)",
            "personInCharge": "WordPress Community Speaker"
          },
          {
            "time": "08:35 AM – 09:10 AM",
            "duration": "35 mins",
            "activity": "Hosting Overview (Platform-Agnostic)",
            "personInCharge": "WordPress Community Speaker"
          },
          {
            "time": "09:10 AM – 10:25 AM",
            "duration": "75 mins",
            "activity": "WordPress Hands-on Workshop",
            "personInCharge": "WordPress Community Team"
          },
          {
            "time": "10:25 AM – 11:00 AM",
            "duration": "35 mins",
            "activity": "Possible Careers in WordPress",
            "personInCharge": "WordPress Community Speaker"
          },
          {
            "time": "11:00 AM – 11:30 AM",
            "duration": "30 mins",
            "activity": "WordPress Community Talk",
            "personInCharge": "WordPress Community Lead"
          },
          {
            "time": "11:30 AM – 12:00 PM",
            "duration": "30 mins",
            "activity": "WordPress Q&A, Mini Games & Swag Distribution",
            "personInCharge": "WordPress Team & Hosts"
          },
          {
            "time": "12:00 PM – 12:45 PM",
            "duration": "45 mins",
            "activity": "Lunch Break",
            "personInCharge": "All Attendees & Organizers"
          },
          {
            "time": "12:45 PM – 02:15 PM",
            "duration": "90 mins",
            "activity": "Session 2: WordPress Integration on AWS",
            "personInCharge": "AWS Student Builder Group Technical Team"
          },
          {
            "time": "02:15 PM – 03:45 PM",
            "duration": "90 mins",
            "activity": "Session 3: Notion Productivity & Workspaces",
            "personInCharge": "Notion Community Leads"
          },
          {
            "time": "03:45 PM – 04:30 PM",
            "duration": "45 mins",
            "activity": "Joint Multi-Track Q&A & Interactive Activity (Raffle)",
            "personInCharge": "Speakers & Emcees"
          },
          {
            "time": "04:30 PM – 05:00 PM",
            "duration": "30 mins",
            "activity": "Awarding of Certificates, Photo-op, and Egress",
            "personInCharge": "JPCS & AWS SBG Officers"
          }
        ]
      },
      "sessions": [
        {
          "id": "ses-1",
          "title": "WordPress Hands-on Workshop",
          "startTime": "2026-11-14T09:10:00+08:00",
          "endTime": "2026-11-14T10:25:00+08:00",
          "speakerIds": [
            "spk-wpm"
          ],
          "description": "Build your first WordPress site with the WordPress Manila team. (Show your finished work to an officer to get your stamp.)"
        },
        {
          "id": "ses-2",
          "title": "Session 2: WordPress Integration on AWS",
          "startTime": "2026-11-14T12:45:00+08:00",
          "endTime": "2026-11-14T14:15:00+08:00",
          "speakerIds": [
            "spk-sbg-tech"
          ],
          "description": "Deploy WordPress to production on Amazon EC2, Amazon RDS and CloudFront. (Show your finished work to an officer to get your stamp.)"
        },
        {
          "id": "ses-3",
          "title": "Session 3: Notion Productivity & Workspaces",
          "startTime": "2026-11-14T14:15:00+08:00",
          "endTime": "2026-11-14T15:45:00+08:00",
          "speakerIds": [
            "spk-notion"
          ],
          "description": "Organize your projects and workflows with Notion. (Show your finished work to an officer to get your stamp.)"
        }
      ]
    },
    {
      "id": "evt-2",
      "match": "^cloud watch",
      "fields": {
        "description": "Cloud Watch is a \"Look but Don't Touch\" session: our officers walk you through the AWS Management Console live, so you can see how common AWS services are found, set up and managed — no AWS account or credits needed on your side.\n\nThe run: a quick look at our website, AWS CloudWatch x Spider-Man: Brand New Day, how the setup behind it works, then a full CloudWatch demo, open Q&A and key takeaways.\n\nA safe first step into AWS before the hands-on labs.\n\nObjectives\n• Get familiar with the AWS Management Console's navigation and key features through a guided live demo.\n• Build foundational knowledge of AWS services and the console without using personal AWS accounts or credits.\n• Build confidence for upcoming hands-on cloud activities in a risk-free setting.",
        "modality": "hybrid",
        "startAt": "2026-10-17T13:30:00+08:00",
        "endAt": "2026-10-17T16:00:00+08:00",
        "venue": "Room 309",
        "participants": 30,
        "participantsEstimated": true,
        "capacity": 30,
        "speakerIds": [
          "spk-fa",
          "spk-2",
          "spk-vna"
        ],
        "programFlow": [
          {
            "time": "01:30 PM – 02:00 PM",
            "duration": "30 mins",
            "activity": "Officer Ingress & Technical Setup",
            "personInCharge": "AWS SBG Officers"
          },
          {
            "time": "02:00 PM – 02:10 PM",
            "duration": "10 mins",
            "activity": "Registration",
            "personInCharge": "AWS SBG Relations"
          },
          {
            "time": "02:10 PM – 02:15 PM",
            "duration": "5 mins",
            "activity": "Opening Remarks",
            "personInCharge": "AWS SBG President"
          },
          {
            "time": "02:15 PM – 02:20 PM",
            "duration": "5 mins",
            "activity": "Part 1: Website Promotion",
            "personInCharge": "AWS SBG Technicals — Francis Anciro"
          },
          {
            "time": "02:20 PM – 02:30 PM",
            "duration": "10 mins",
            "activity": "Part 2: AWS CloudWatch x Spider-Man",
            "personInCharge": "AWS SBG Technicals — Francis Anciro"
          },
          {
            "time": "02:30 PM – 02:40 PM",
            "duration": "10 mins",
            "activity": "Part 3: Explanation of Infrastructure",
            "personInCharge": "AWS SBG President — Rodmina Jhoy Ibe"
          },
          {
            "time": "02:40 PM – 03:30 PM",
            "duration": "50 mins",
            "activity": "Part 4: CloudWatch Demo",
            "personInCharge": "AWS SBG Technicals — Vince Nelmar Alobin"
          },
          {
            "time": "03:30 PM – 03:45 PM",
            "duration": "15 mins",
            "activity": "Part 5: Open Q&A & Key Takeaways",
            "personInCharge": "AWS SBG President & Technicals"
          },
          {
            "time": "03:45 PM – 03:50 PM",
            "duration": "5 mins",
            "activity": "Closing Remarks, Photo Opportunity & Feedback",
            "personInCharge": "AWS SBG Officers and Attendees"
          },
          {
            "time": "03:50 PM – 04:00 PM",
            "duration": "10 mins",
            "activity": "Networking & Free Discussion",
            "personInCharge": "AWS SBG Officers and Attendees"
          },
          {
            "time": "04:00 PM – 05:30 PM",
            "duration": "90 mins",
            "activity": "Officer Egress",
            "personInCharge": "AWS SBG Officers"
          }
        ]
      }
    },
    {
      "id": "evt-6",
      "match": "^aws launchpad: core services",
      "fields": {
        "description": "An internal working session for the AWS SBG-APC officers (officers only).\n\nCore officers meet to review upcoming materials, coordinate general operations and make sure everything is ready for our upcoming cloud community activities and student tracks — so we keep delivering a great learning experience for our peers.\n\nSee you all at the meeting! ⚡\n\n#AWSCloudClub #StudentBuilders #InternalSync #CloudComputing",
        "audience": "officers",
        "startAt": "2026-05-19T11:30:00+08:00",
        "endAt": "2026-05-19T13:30:00+08:00",
        "venue": "Room 309",
        "participants": 0,
        "participantsEstimated": false,
        "capacity": 0,
        "speakerIds": []
      }
    },
    {
      "id": "evt-7",
      "match": "^aws launchpad: intro to cloud",
      "fields": {
        "description": "AWS Launchpad is our beginner-friendly seminar on cloud computing and the Amazon Web Services ecosystem.\n\nA student guest speaker walks you through the cloud landscape, our President takes a deep dive into the core services — Amazon EC2, Amazon S3 and Amazon RDS — and the Technicals team showcases the \"Vibe-to-Cloud Playbook\", an interactive guide that makes these services easy to understand. The goal: bridge classroom theory and real-world practice so you leave with a cloud-ready mindset.\n\nObjectives\n• Build foundational knowledge of cloud computing and core AWS services.\n• Understand how these services are used in real professional environments.\n• Show accessible paths into the cloud industry for the APC community.",
        "startAt": "2026-05-21T13:00:00+08:00",
        "endAt": "2026-05-21T17:00:00+08:00",
        "venue": "APC Auditorium (12F)",
        "participants": 170,
        "participantsEstimated": true,
        "capacity": 170,
        "speakerIds": [
          "spk-jlr",
          "spk-2",
          "spk-vna"
        ],
        "programFlow": [
          {
            "time": "07:00 AM – 12:00 PM",
            "duration": "5 hours",
            "activity": "Ingress and Technical Setup",
            "personInCharge": "Operations"
          },
          {
            "time": "12:00 PM – 01:00 PM",
            "duration": "60 mins",
            "activity": "Preparation and Final Briefing",
            "personInCharge": "All Committees"
          },
          {
            "time": "01:00 PM – 01:30 PM",
            "duration": "30 mins",
            "activity": "Registration",
            "personInCharge": "Relations"
          },
          {
            "time": "01:30 PM – 01:45 PM",
            "duration": "15 mins",
            "activity": "Opening Remarks and Club Introduction",
            "personInCharge": "President / Vice President"
          },
          {
            "time": "01:45 PM – 02:45 PM",
            "duration": "60 mins",
            "activity": "Walkthrough AWS",
            "personInCharge": "Guest Speaker — John Lexter Reyes"
          },
          {
            "time": "02:45 PM – 03:00 PM",
            "duration": "15 mins",
            "activity": "Energizer and Cloud Trivia",
            "personInCharge": "Marketing"
          },
          {
            "time": "03:00 PM – 03:45 PM",
            "duration": "45 mins",
            "activity": "Deep Dive: Core Services (EC2, S3, RDS)",
            "personInCharge": "President — Rodmina Jhoy Ibe"
          },
          {
            "time": "03:45 PM – 04:30 PM",
            "duration": "45 mins",
            "activity": "Project Showcase: Vibe-to-Cloud Playbook",
            "personInCharge": "Technicals — Vince Nelmar Alobin"
          },
          {
            "time": "04:30 PM – 05:00 PM",
            "duration": "30 mins",
            "activity": "Q&A, Photo Op, and Egress",
            "personInCharge": "All Committees"
          }
        ]
      }
    },
    {
      "id": "evt-5",
      "match": "mini[- ]?org fair",
      "fields": {
        "description": "Meet the AWS Student Builder Group – APC! At the Mini-Org Fair our officers introduce the org's mission and goals and what members get out of it — projects, activities and achievements, hands-on demos and interactive booths — and answer your questions about joining.\n\nObjectives\n• Introduce the organization's mission, vision and core initiatives to prospective members.\n• Encourage participation by showcasing our programs and opportunities for personal, academic and professional growth.\n• Build connections between officers, members and interested students.",
        "startAt": "2026-07-10T08:00:00+08:00",
        "endAt": "2026-07-10T16:30:00+08:00",
        "venue": "APC Cafeteria",
        "participants": 100,
        "participantsEstimated": true,
        "capacity": 100,
        "speakerIds": []
      }
    },
    {
      "id": "evt-4",
      "match": "^org fair 2026",
      "fields": {
        "description": "🎮 Main quest unlocked: Cloud Builders Assemble! 🦇\n\nThe AWS Student Builder Group – Asia Pacific College is recruiting student builders, coders and tech enthusiasts at the AWS Org Fair 2026 (re-scheduled to August 17–20). Level up your skills, work on hands-on cloud projects and build your network with real Amazon Web Services tools — open to all skill levels.\n\nHow to play\n1. Scan the QR code at our booth to open the registration form.\n2. Visit us at Multi-Purpose Hall 1 (MPH1).\n3. Press [START] on your cloud journey.\n\nOur officers showcase the org's projects, activities and achievements at interactive booths, with demos and answers about membership.\n\nObjectives\n• Introduce the organization's mission, vision and core initiatives to prospective members and the campus community.\n• Encourage participation through our programs, projects and growth opportunities.\n• Promote active membership and connections between officers, members and interested students.\n\nGotham isn't built in a day. It's built in the Cloud. ⚡",
        "startAt": "2026-08-17T07:30:00+08:00",
        "endAt": "2026-08-20T17:00:00+08:00",
        "venue": "Multi-Purpose Hall 1 (MPH1)",
        "participants": 200,
        "participantsEstimated": true,
        "capacity": 200,
        "speakerIds": []
      }
    },
    {
      "id": "evt-3",
      "match": "(scd|student community day) mega manila",
      "fields": {
        "description": "AWS Student Community Day Mega Manila 2026 is a flagship, student-led inter-collegiate conference bringing together cloud enthusiasts, software developers and technology professionals, hosted at Asia Pacific College.\n\nBuilt on a \"Learn by Doing\" philosophy: keynote talks, technical seminars and concurrent hands-on workshops — Agora Agents SDK, Amazon Web Services MCP + OpenCode, and the AWS BuilderCards Tournament.\n\nVenues: Auditorium (12F), MPH1 (1F), Rooms 304 & 306, and Room 813 (8F).\n\nWho it's for: the AWS student community (300–350 participants), plus sponsors, speakers and guests.\n\nObjectives\n• Create a collaborative space where student developers across Metro Manila exchange cloud knowledge and grow their networks.\n• Give hands-on technical experience through workshops and expert-led tracks on AWS services.\n• Support careers by introducing AWS certification pathways and industry-recognized credentials.\n• Connect classroom theory with real-world cloud practice.",
        "startAt": "2026-09-11T08:00:00+08:00",
        "endAt": "2026-09-11T18:00:00+08:00",
        "venue": "Asia Pacific College — Auditorium (12F), MPH1 (1F), Rooms 304 & 306, Room 813 (8F)",
        "coOrganizers": [
          "AWS Student Community Day Mega Manila 2026"
        ],
        "participants": 350,
        "participantsEstimated": true,
        "capacity": 350
      }
    }
  ]
};
