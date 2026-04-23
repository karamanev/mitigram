import type { Contact, Group } from './types';

export const MOCK_CONTACTS: Contact[] = [
  { id: 'contact_alice',   name: 'Alice Schmidt',         email: 'alice.schmidt@deutsche-bank.example-bank.com' },
  { id: 'contact_bob',     name: 'Bob Müller',             email: 'bob.mueller@commerzbank.example-bank.com' },
  { id: 'contact_carol',   name: 'Carol Dubois',           email: 'carol.dubois@bnp-paribas.example-bank.com' },
  { id: 'contact_david',   name: 'David Fontaine',         email: 'david.fontaine@societe-generale.example-bank.com' },
  { id: 'contact_elena',   name: 'Ελένη Παπαδοπούλου',    email: 'elena.papadopoulou@eurobank.example-bank.com' },
  { id: 'contact_frank',   name: 'Frank van den Berg',     email: 'frank.vandenberg@ing.example-bank.com' },
  { id: 'contact_grace',   name: 'Grace O\'Sullivan',      email: 'grace.osullivan@aib.example-bank.com' },
  { id: 'contact_hiro',    name: 'Hiroshi Tanaka',         email: 'h.tanaka@mizuho.example-bank.com' },
  { id: 'contact_ivan',    name: 'Ivan Petrov',            email: 'ivan.petrov@vtb.example-bank.com' },
  { id: 'contact_julia',   name: 'Julia Chen',             email: 'julia.chen+trade@icbc.example-bank.com' },
  { id: 'contact_kenji',   name: 'Kenji Nakamura',         email: 'kenji.nakamura@smbc.example-bank.com' },
  { id: 'contact_li',      name: 'Li Wei',                 email: 'li.wei@boc.example-bank.com' },
  { id: 'contact_maria',   name: 'María José García',      email: 'maria.garcia@santander.example-bank.com' },
  { id: 'contact_nathan',  name: 'Nathan Brooks',          email: 'n.brooks@jpmorgan.example-bank.com' },
  { id: 'contact_olivia',  name: 'Olivia Washington',      email: 'olivia.washington@bankofamerica.example-bank.com' },
  { id: 'contact_pierre',  name: 'Pierre Lefevre',         email: 'pierre.lefevre@credit-agricole.example-bank.com' },
  { id: 'contact_quinn',   name: 'Quinn Fitzgerald',       email: 'q.fitzgerald@citibank.example-bank.com' },
  { id: 'contact_rafael',  name: 'Rafael Souza',           email: 'rafael.souza@itau.example-bank.com' },
  { id: 'contact_sara',    name: 'Sara Lindqvist',         email: 'sara.lindqvist@nordea.example-bank.com' },
  { id: 'contact_thomas',  name: 'Thomas Keller',          email: 'thomas.keller@ubs.demo-corp.eu' },
];

export const MOCK_GROUPS: Group[] = [
  {
    id: 'group_eu_banks',
    name: 'EU Banks',
    members: [
      MOCK_CONTACTS[0],  // Alice Schmidt
      MOCK_CONTACTS[1],  // Bob Müller
      MOCK_CONTACTS[2],  // Carol Dubois
      MOCK_CONTACTS[3],  // David Fontaine
      MOCK_CONTACTS[4],  // Elena Papadopoulou
      MOCK_CONTACTS[5],  // Frank van den Berg
      MOCK_CONTACTS[6],  // Grace O'Sullivan
      MOCK_CONTACTS[12], // María García
      MOCK_CONTACTS[15], // Pierre Lefevre
    ],
  },
  {
    id: 'group_asian_banks',
    name: 'Asian Banks',
    members: [
      MOCK_CONTACTS[7],  // Hiroshi Tanaka
      MOCK_CONTACTS[9],  // Julia Chen
      MOCK_CONTACTS[10], // Kenji Nakamura
      MOCK_CONTACTS[11], // Li Wei
    ],
  },
  {
    id: 'group_us_banks',
    name: 'US Banks',
    members: [
      MOCK_CONTACTS[13], // Nathan Brooks
      MOCK_CONTACTS[14], // Olivia Washington
      MOCK_CONTACTS[16], // Quinn Fitzgerald
      MOCK_CONTACTS[17], // Rafael Souza
    ],
  },
  {
    id: 'group_top_tier',
    name: 'Top Tier',
    members: [
      MOCK_CONTACTS[0],  // Alice Schmidt   (also EU Banks)
      MOCK_CONTACTS[7],  // Hiroshi Tanaka  (also Asian Banks)
      MOCK_CONTACTS[13], // Nathan Brooks   (also US Banks)
      MOCK_CONTACTS[19], // Thomas Keller
    ],
  },
  {
    id: 'group_favourites',
    name: 'Favourites',
    members: [
      MOCK_CONTACTS[0],  // Alice Schmidt   (also EU Banks + Top Tier)
      MOCK_CONTACTS[9],  // Julia Chen      (also Asian Banks)
      MOCK_CONTACTS[18], // Sara Lindqvist
      MOCK_CONTACTS[8],  // Ivan Petrov
    ],
  },
];
