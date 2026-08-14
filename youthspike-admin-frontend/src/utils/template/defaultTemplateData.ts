// ─────────────────────────────────────────────────────────────
// utils/defaultData.ts – seed data for the editor
// ─────────────────────────────────────────────────────────────

import { ISampleUser, ITemplatePlaceholder } from '@/types';

export const DEFAULT_NAME = 'New Template';
export const DEFAULT_SUBJECT = '{{event_name}} – Captain\'s Login Credentials & Rankings';

export const DEFAULT_BODY = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{event_name}} Captain's Login Credentials & Rankings</title>
  <style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:20px;background-color:#f9f9f9}
    .container{max-width:800px;margin:0 auto;background:#fff;padding:20px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
    h1{font-size:24px;color:#0056b3}h2{font-size:18px;color:#444;margin-top:20px}
    ul{padding-left:20px;margin:10px 0}ul li{margin-bottom:8px}
    a{color:#0056b3;text-decoration:none}a:hover{text-decoration:underline}
    .important{font-weight:bold;color:#000}.underscore{text-decoration:underline;color:#0056b3}
    .footer{margin-top:20px;font-size:14px;color:#555}
  </style>
</head>
<body>
  <div class="container">
    <h1>{{event_name}} Captain's Login Credentials &amp; Rankings</h1>
    <p>Hi <span class="important">{{captain}}</span>,</p>
    <p>We're thrilled to have you joining us for the tournament starting <span class="important">{{event_date}}</span>! This year, we're using the latest <strong>ASL Software</strong> to make everything smoother and more efficient.</p>
    <hr>
    <h2>Two Things We Need You to Do as Captain</h2>
    <ul>
      <li class="underscore"><a href="https://form.jotform.com/250247696468167">View the Squad Ranking Instruction Form.</a></li>
      <li><strong>Log into the Matchplay software:</strong>
        <ul>
          <li>Rank your players per the ASL rules.</li>
          <li>Take a screenshot of the ranking page and submit it using the Ranking Agreement Form.</li>
        </ul>
      </li>
    </ul>
    <hr>
    <h2>Important Details</h2>
    <h3>1. Matchplay</h3>
    <p>This will handle player assignments and display standings for group play.</p>
    <ul>
      <li><strong>Login Details:</strong>
        <ul>
          <li>Username: <span class="important">{{player_username}}</span> (not case sensitive)</li>
          <li>Password: <span class="important">{{player_password}}</span></li>
        </ul>
      </li>
      <li><a href="{{admin_client_url}}">Log in here: <span class="underscore">admin.aslquads.com</span></a></li>
    </ul>
    <h3>2. Player Rankings and Roster Lock</h3>
    <p>As captain, you can log in and set your player rankings until <span class="important">{{roster_lock_date}}</span>.</p>
    <h3>3. Fwango</h3>
    <p>Didn't get it? <a href="{{fwango_url}}">Access Fwango here: {{fwango_url}}</a>.</p>
    <hr>
    <h2>Helpful Tips</h2>
    <ul>
      <li>Public View: <a href="{{frontend_url}}">aslsquads.com</a></li>
      <li>Coach's View: <a href="{{admin_client_url}}">admin.aslsquads.com</a></li>
    </ul>
    <hr>
    <p><strong>Warmly,</strong></p>
    <p>{{ldo_director_name}}<br>{{ldo_name}}<br>
      📧 <a href="mailto:{{ldo_email}}">{{ldo_email}}</a><br>
      🌐 <a href="{{american_spikers_url}}">AmericanSpikers.com</a></p>
  </div>
</body>
</html>`;

export const DEFINED_PLACEHOLDERS: ITemplatePlaceholder[] = [
  { key: 'event_name',          label: 'Event Name',          sampleValue: 'ASL Spring Classic 2025' },
  { key: 'captain',             label: 'Captain Name',         sampleValue: 'Jordan Rivera' },
  { key: 'event_date',          label: 'Event Date',           sampleValue: 'March 15, 2025' },
  { key: 'player_username',     label: 'Player Username',      sampleValue: 'jrivera_asl' },
  { key: 'player_password',     label: 'Player Password',      sampleValue: 'Temp#9821' },
  { key: 'admin_client_url',    label: 'Admin Client URL',     sampleValue: 'https://admin.aslsquads.com' },
  { key: 'roster_lock_date',    label: 'Roster Lock Date',     sampleValue: 'March 12, 2025' },
  { key: 'fwango_url',          label: 'Fwango URL',           sampleValue: 'https://fwango.io/asl2025' },
  { key: 'frontend_url',        label: 'Frontend URL',         sampleValue: 'https://aslsquads.com' },
  { key: 'ldo_director_name',   label: 'LDO Director Name',    sampleValue: 'Alex Thompson' },
  { key: 'ldo_name',            label: 'LDO Name',             sampleValue: 'American Spikers League' },
  { key: 'ldo_email',          label: 'LDO Email',            sampleValue: 'director@americanspikers.com' },
  { key: 'american_spikers_url',label: 'American Spikers URL', sampleValue: 'https://americanspikers.com' },
];

export const SAMPLE_USERS: ISampleUser[] = [
  {
    id: 'user1',
    label: 'Jordan Rivera – Team Surge',
    values: Object.fromEntries(DEFINED_PLACEHOLDERS.map((p) => [p.key, p.sampleValue])),
  },
  {
    id: 'user2',
    label: 'Morgan Chen – Team Blaze',
    values: {
      event_name: 'ASL Spring Classic 2025',
      captain: 'Morgan Chen',
      event_date: 'March 15, 2025',
      player_username: 'mchen_blaze',
      player_password: 'Blaze#4472',
      admin_client_url: 'https://admin.aslsquads.com',
      roster_lock_date: 'March 12, 2025',
      fwango_url: 'https://fwango.io/asl2025',
      frontend_url: 'https://aslsquads.com',
      ldo_director_name: 'Alex Thompson',
      ldo_name: 'American Spikers League',
      ldo_email: 'director@americanspikers.com',
      american_spikers_url: 'https://americanspikers.com',
    },
  },
];