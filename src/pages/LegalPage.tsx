import type { ReactNode } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { brand } from '../theme/theme';
import { SITE, mailTo } from '../siteInfo';
import SiteFooter from '../components/SiteFooter';

function H({ children }: { children: ReactNode }) {
  return (
    <Typography variant="h3" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>
      {children}
    </Typography>
  );
}
function P({ children }: { children: ReactNode }) {
  return (
    <Typography variant="body2" sx={{ mb: 1.25, lineHeight: 1.7 }}>
      {children}
    </Typography>
  );
}
function L({ items }: { items: ReactNode[] }) {
  return (
    <Box component="ul" sx={{ mt: 0, mb: 1.5, pl: 2.5 }}>
      {items.map((x, i) => (
        <Typography key={i} component="li" variant="body2" sx={{ lineHeight: 1.7, mb: 0.5 }}>
          {x}
        </Typography>
      ))}
    </Box>
  );
}
const Email = () => (
  <Link href={mailTo(`[${SITE.appName}] Privacy request`)} sx={{ fontWeight: 600 }}>
    {SITE.contactEmail}
  </Link>
);

function Privacy() {
  return (
    <>
      <P>
        This notice explains what the {SITE.appName} (the "app") collects about you, why, who can see it, and how you can
        ask us to see, fix or delete it. The app is run by the {SITE.club} for its events. We follow the Philippine Data
        Privacy Act of 2012 (Republic Act No. 10173).
      </P>
      <H>What we collect</H>
      <L
        items={[
          <><b>Account details</b>: your name, email (APC or personal), APC student ID or your school / organization, and for officers your position and committee.</>,
          <><b>Profile</b> (optional): photo, short bio and social links you add.</>,
          <><b>Event activity</b>: events you register for, your check-in time, session stamps, food stubs claimed, evaluation answers, and your certificate code.</>,
          <><b>Officer work</b>: tasks, comments, sign-off requests and the duties you are given.</>,
          <><b>Connections</b> you make with other members, and events you save.</>,
          <><b>Sign-in records</b>: when you last signed in and how many times, and failed sign-in attempts (to protect your account).</>,
        ]}
      />
      <P>We don't use advertising, tracking cookies or analytics tools, and we don't sell your data.</P>
      <H>Why we use it</H>
      <L
        items={[
          'To run club events: registration, check-in, stamps, food stubs, evaluations and certificates.',
          'To send you notices about your account, events and tasks (in the app and by email).',
          'To let officers and the adviser organize events and work.',
          'To keep the app secure (for example, password codes and sign-in limits).',
        ]}
      />
      <H>Who can see it</H>
      <L
        items={[
          'Club admins and the adviser can see account details and event activity.',
          "Officers can see what they need for their duties, for example the attendee list at an event where they handle check-in.",
          'Signed-in members can see your name, photo, bio, social links and achievements when they open your profile or scan your QR card.',
          "Anyone with your certificate code can check that the certificate is real (it shows your name, the event and the date).",
        ]}
      />
      <H>Where it is stored</H>
      <P>
        Your data is stored on Amazon Web Services in the Asia Pacific (Singapore) region. Emails are sent through Amazon
        Simple Email Service (or Gmail). The app is hosted on Vercel. Your browser keeps your sign-in and a saved copy of
        recent pages on your device so the app works when the connection drops; signing out clears your sign-in.
      </P>
      <H>How long we keep it</H>
      <P>
        We keep your data while your account is active and as part of the club's event records. Officer accounts may be
        kept as alumni records after the school year. You can ask us to delete your account at any time.
      </P>
      <H>Your rights</H>
      <P>
        You can ask to see a copy of your data, correct it, or delete your account. You can fix most details yourself on
        your profile. For anything else, email <Email />. We will reply as soon as we can. You can also file a complaint
        with the National Privacy Commission.
      </P>
      <H>Changes</H>
      <P>If we change this notice, we will update the date at the top and tell you in the app.</P>
    </>
  );
}

function Terms() {
  return (
    <>
      <P>
        By creating an account or using the {SITE.appName} (the "app") you agree to these terms. The app is run by the{' '}
        {SITE.club} for its members, guests and partners.
      </P>
      <H>Your account</H>
      <L
        items={[
          'Give your real name and correct details (student ID or school / organization). Admins may ask you to fix them.',
          'Keep your password and verification codes to yourself. Never share a code, even with officers.',
          "An admin approves new accounts and may decline, suspend or remove an account that breaks these terms.",
        ]}
      />
      <H>Using the app</H>
      <L
        items={[
          'Use the app only for club events and activities.',
          'Do not try to check in, collect stamps, claim food or get a certificate for someone else, or more than once.',
          'Only add links to your own profiles and to documents from trusted services. Do not post harmful, offensive or misleading content.',
          "Do not try to break, overload or get around the app's security.",
        ]}
      />
      <H>Events, stamps and certificates</H>
      <P>
        Certificates are given for events you attended and completed as the event requires (for example, all stamps and the
        evaluation). The club may cancel a certificate, stamp or claim that was given by mistake or obtained unfairly.
      </P>
      <H>Officers and staff</H>
      <P>
        Officers, co-organizer staff and the adviser may only use the data they see for their club duties and must keep it
        private.
      </P>
      <H>Availability</H>
      <P>
        We try to keep the app working, but it may sometimes be unavailable or change. Features may be added or removed.
      </P>
      <H>Privacy</H>
      <P>
        How we handle your data is explained in the{' '}
        <Link component={RouterLink} to="/privacy" sx={{ fontWeight: 600 }}>
          Privacy Notice
        </Link>
        .
      </P>
      <H>Contact</H>
      <P>
        Questions or concerns: <Email />.
      </P>
    </>
  );
}

/** Public Privacy Notice and Terms of Use pages. */
export default function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', px: 2, py: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 760, mx: 'auto' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} sx={{ mb: 1.5 }}>
          Back
        </Button>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }} data-testid={`legal-${kind}`}>
          <Typography variant="overline" sx={{ color: brand.primary, fontWeight: 800 }}>
            {SITE.appName}
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' }, mb: 0.5 }}>
            {kind === 'privacy' ? 'Privacy Notice' : 'Terms of Use'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Effective {SITE.termsDate}
          </Typography>
          <Box sx={{ mt: 2 }}>{kind === 'privacy' ? <Privacy /> : <Terms />}</Box>
        </Paper>
        <SiteFooter />
      </Box>
    </Box>
  );
}
