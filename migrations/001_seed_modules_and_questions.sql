-- ═══════════════════════════════════════════════════════════════
-- Project STAR Safeguarding Course — Seed Migration
-- Populates database with existing 8 modules and 40 quiz questions
-- ═══════════════════════════════════════════════════════════════

-- Clear existing data (for re-runs)
DELETE FROM question_options;
DELETE FROM questions;
DELETE FROM modules;

-- ═══════════════════════════════════════════════════════════════
-- MODULE 1: Introduction to Safeguarding
-- ═══════════════════════════════════════════════════════════════
INSERT INTO modules (module_id, num, title, description, content_html, display_order, is_active) VALUES
('m1', 'Module 1', 'Introduction to Safeguarding', 'Policy statement, purpose, and core principles',
'<!-- Content will be extracted from index.html -->', 1, true);

-- Module 1 Questions
INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m1', 'What is the primary purpose of safeguarding?',
 'Safeguarding is the action taken to promote the welfare of children and protect them from harm.', 0);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Enforcing discipline on students', false, 0),
(currval('questions_id_seq'), 'Promoting welfare of children and protecting them from harm', true, 1),
(currval('questions_id_seq'), 'Managing examination schedules', false, 2),
(currval('questions_id_seq'), 'Processing student admissions', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m1', 'Who does the Project STAR Safeguarding Policy apply to?',
 'The policy is binding on ALL individuals and organisations associated with Project STAR — staff, volunteers, partners, and visitors.', 1);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Only full-time staff', false, 0),
(currval('questions_id_seq'), 'Only those working directly with children', false, 1),
(currval('questions_id_seq'), 'All individuals and organisations associated with Project STAR', true, 2),
(currval('questions_id_seq'), 'Only the DSL and Board members', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m1', 'Under the Child Rights Act 2003, what age defines a child?',
 'A child is any person under the age of 18 years, aligned with the Child Rights Act 2003.', 2);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Under 16', false, 0),
(currval('questions_id_seq'), 'Under 18', true, 1),
(currval('questions_id_seq'), 'Under 21', false, 2),
(currval('questions_id_seq'), 'Under 14', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m1', 'What approach does Project STAR take to abuse and exploitation?',
 'Project STAR maintains a zero-tolerance approach to any form of abuse, exploitation, or harm.', 3);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Case-by-case evaluation', false, 0),
(currval('questions_id_seq'), 'Zero tolerance', true, 1),
(currval('questions_id_seq'), 'Three-strike policy', false, 2),
(currval('questions_id_seq'), 'Informal resolution', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m1', 'Which of these is NOT a programme covered by the policy?',
 'The policy covers CBT Services, Digital Skills Academy, and Academic Support Programmes. Financial Advisory Services is not a Project STAR programme.', 4);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'CBT Services', false, 0),
(currval('questions_id_seq'), 'Digital Skills Academy', false, 1),
(currval('questions_id_seq'), 'Financial Advisory Services', true, 2),
(currval('questions_id_seq'), 'Academic Support', false, 3);

-- ═══════════════════════════════════════════════════════════════
-- MODULE 2: Legal Framework & Governance
-- ═══════════════════════════════════════════════════════════════
INSERT INTO modules (module_id, num, title, description, content_html, display_order, is_active) VALUES
('m2', 'Module 2', 'Legal Framework & Governance', 'Laws, regulations, and accountability structure',
'<!-- Content will be extracted from index.html -->', 2, true);

-- Module 2 Questions
INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m2', 'Which legislation is the primary legal foundation for child protection in Nigeria?',
 'The Child Rights Act 2003 is the primary legal framework establishing children''s rights and child protection standards.', 0);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Constitution 1999', false, 0),
(currval('questions_id_seq'), 'Child Rights Act 2003', true, 1),
(currval('questions_id_seq'), 'Violence Against Persons Act 2015', false, 2),
(currval('questions_id_seq'), 'Education Act', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m2', 'Who holds ULTIMATE accountability for safeguarding at Project STAR?',
 'The Project STAR Board holds ultimate accountability for safeguarding.', 1);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'The DSL', false, 0),
(currval('questions_id_seq'), 'The Project Director', false, 1),
(currval('questions_id_seq'), 'The Board', true, 2),
(currval('questions_id_seq'), 'The Ministry of Education', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m2', 'How often should the Board receive safeguarding reports?',
 'The Board receives quarterly safeguarding reports from the DSL.', 2);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Monthly', false, 0),
(currval('questions_id_seq'), 'Quarterly', true, 1),
(currval('questions_id_seq'), 'Annually', false, 2),
(currval('questions_id_seq'), 'Only when incidents occur', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m2', 'Who is the current DSL for Project STAR?',
 'Bukola Adeleke is the current Designated Safeguarding Lead.', 3);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Rachael Ojerinde', false, 0),
(currval('questions_id_seq'), 'Bukola Adeleke', true, 1),
(currval('questions_id_seq'), 'The Board Chair', false, 2),
(currval('questions_id_seq'), 'The School Principal', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m2', 'What is the Session Safeguarding Lead''s reporting timeframe to the DSL?',
 'SSLs must report all concerns to the DSL within 24 hours of a session.', 4);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Immediately', false, 0),
(currval('questions_id_seq'), 'Within 24 hours', true, 1),
(currval('questions_id_seq'), 'Within 48 hours', false, 2),
(currval('questions_id_seq'), 'At the next team meeting', false, 3);

-- ═══════════════════════════════════════════════════════════════
-- MODULE 3: Recognising Abuse & Harm
-- ═══════════════════════════════════════════════════════════════
INSERT INTO modules (module_id, num, title, description, content_html, display_order, is_active) VALUES
('m3', 'Module 3', 'Recognising Abuse & Harm', 'Types of abuse, indicators, and specific concerns',
'<!-- Content will be extracted from index.html -->', 3, true);

-- Module 3 Questions
INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m3', 'Which of the following is a behavioural indicator of emotional abuse?',
 'Low self-esteem and difficulty forming relationships are key indicators of emotional abuse.', 0);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Unexplained bruises', false, 0),
(currval('questions_id_seq'), 'Persistent hunger', false, 1),
(currval('questions_id_seq'), 'Low self-esteem and difficulty forming relationships', true, 2),
(currval('questions_id_seq'), 'Sexually inappropriate language', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m3', 'A student suddenly has expensive new items and is secretive about their whereabouts. This could indicate:',
 'Unexplained gifts/money and secretive behaviour are warning signs of CSE.', 1);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Good family circumstances', false, 0),
(currval('questions_id_seq'), 'Child Sexual Exploitation', true, 1),
(currval('questions_id_seq'), 'Normal adolescent behaviour', false, 2),
(currval('questions_id_seq'), 'Academic success rewards', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m3', 'What is a specific safeguarding concern unique to Project STAR''s CBT context?',
 'Examination exploitation — being pressured to engage in fraud or offered ''help'' for payment — is a specific concern in the CBT context.', 2);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Cyberbullying', false, 0),
(currval('questions_id_seq'), 'Examination exploitation', true, 1),
(currval('questions_id_seq'), 'FGM', false, 2),
(currval('questions_id_seq'), 'Forced marriage', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m3', 'A child hints about secrets they cannot tell and mentions a new older ''friend''. Which type of abuse might this indicate?',
 'Hints about secrets and references to new adult ''friends'' are disclosure indicators of sexual abuse.', 3);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Physical abuse', false, 0),
(currval('questions_id_seq'), 'Neglect', false, 1),
(currval('questions_id_seq'), 'Sexual abuse', true, 2),
(currval('questions_id_seq'), 'Emotional abuse', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m3', 'Why might abuse be harder to recognise in children with disabilities?',
 'Children with disabilities may be particularly vulnerable, and communication difficulties may mask signs of abuse.', 4);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'They are less likely to be abused', false, 0),
(currval('questions_id_seq'), 'Communication difficulties may mask signs', true, 1),
(currval('questions_id_seq'), 'Disability is not a risk factor', false, 2),
(currval('questions_id_seq'), 'Their parents are more attentive', false, 3);

-- ═══════════════════════════════════════════════════════════════
-- MODULE 4: Reporting Procedures
-- ═══════════════════════════════════════════════════════════════
INSERT INTO modules (module_id, num, title, description, content_html, display_order, is_active) VALUES
('m4', 'Module 4', 'Reporting Procedures', 'How to report concerns and what happens next',
'<!-- Content will be extracted from index.html -->', 4, true);

-- Module 4 Questions
INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m4', 'What is the FIRST thing you should do if a child discloses abuse to you?',
 'Listen carefully and calmly — give the child your full attention.', 0);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Contact the police', false, 0),
(currval('questions_id_seq'), 'Listen carefully and calmly', true, 1),
(currval('questions_id_seq'), 'Tell their parent/guardian', false, 2),
(currval('questions_id_seq'), 'Ask detailed questions about what happened', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m4', 'A child asks you to keep a secret about abuse. You should:',
 'You must be honest — explain you cannot keep it secret but will share only with those who need to know to help.', 1);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Promise to keep their secret to build trust', false, 0),
(currval('questions_id_seq'), 'Explain you cannot keep it secret but will share only with people who need to know', true, 1),
(currval('questions_id_seq'), 'Refuse to listen', false, 2),
(currval('questions_id_seq'), 'Tell the child to report it themselves', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m4', 'How quickly should serious safeguarding concerns be reported?',
 'Serious concerns must be reported same day. Lower-level concerns within 24 hours.', 2);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Within a week', false, 0),
(currval('questions_id_seq'), 'At the next team meeting', false, 1),
(currval('questions_id_seq'), 'Same day', true, 2),
(currval('questions_id_seq'), 'Within a month', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m4', 'Which of these requires MANDATORY referral to police?',
 'FGM is one of several concerns requiring mandatory referral to police/statutory authorities.', 3);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'A child being disruptive in class', false, 0),
(currval('questions_id_seq'), 'Suspected examination malpractice', false, 1),
(currval('questions_id_seq'), 'Female Genital Mutilation', true, 2),
(currval('questions_id_seq'), 'A child arriving late to sessions', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m4', 'After receiving a verbal disclosure, you must follow up with:',
 'All verbal reports must be followed up with a written Safeguarding Incident Report Form within 24 hours.', 4);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'A social media post', false, 0),
(currval('questions_id_seq'), 'A written Safeguarding Incident Report Form within 24 hours', true, 1),
(currval('questions_id_seq'), 'An email to all staff', false, 2),
(currval('questions_id_seq'), 'A phone call to the child''s family', false, 3);

-- ═══════════════════════════════════════════════════════════════
-- MODULE 5: CBT Services Safeguarding
-- ═══════════════════════════════════════════════════════════════
INSERT INTO modules (module_id, num, title, description, content_html, display_order, is_active) VALUES
('m5', 'Module 5', 'CBT Services Safeguarding', 'Specific controls for CBT examination environments',
'<!-- Content will be extracted from index.html -->', 5, true);

-- Module 5 Questions
INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m5', 'What is the maximum number of candidates per Session Safeguarding Lead in CBT?',
 'Maximum 40 candidates per SSL in CBT sessions.', 0);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), '20', false, 0),
(currval('questions_id_seq'), '30', false, 1),
(currval('questions_id_seq'), '40', true, 2),
(currval('questions_id_seq'), '50', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m5', 'A candidate is being offered ''help'' with exam answers for money. This is:',
 'Examination exploitation is both an integrity issue AND a safeguarding concern — the candidate may be being exploited.', 1);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Only an examination integrity issue', false, 0),
(currval('questions_id_seq'), 'Both an exam integrity AND safeguarding concern', true, 1),
(currval('questions_id_seq'), 'A normal commercial activity', false, 2),
(currval('questions_id_seq'), 'Not reportable', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m5', 'Mobile phones in the CBT area are:',
 'No mobile phones or personal devices are permitted in the CBT area.', 2);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Allowed on silent', false, 0),
(currval('questions_id_seq'), 'Allowed for emergencies only', false, 1),
(currval('questions_id_seq'), 'Not permitted', true, 2),
(currval('questions_id_seq'), 'Allowed for checking time', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m5', 'How often should comfort breaks be scheduled for CBT sessions?',
 'Scheduled breaks for sessions over 1 hour — minimum 10-minute break per 90 minutes.', 3);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Every 30 minutes', false, 0),
(currval('questions_id_seq'), 'Every 60 minutes', false, 1),
(currval('questions_id_seq'), 'Minimum 10-minute break per 90 minutes', true, 2),
(currval('questions_id_seq'), 'No breaks required', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m5', 'A candidate shows extreme anxiety, hyperventilating during a session. You should:',
 'Provide immediate support, move to quiet area if needed, and contact DSL immediately for serious mental health concerns.', 4);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Ignore it — exams are stressful', false, 0),
(currval('questions_id_seq'), 'Ask them to leave the room', false, 1),
(currval('questions_id_seq'), 'Provide immediate support, move to quiet area, and contact DSL if serious', true, 2),
(currval('questions_id_seq'), 'Tell them to calm down', false, 3);

-- ═══════════════════════════════════════════════════════════════
-- MODULE 6: Digital Safety & Online Protection
-- ═══════════════════════════════════════════════════════════════
INSERT INTO modules (module_id, num, title, description, content_html, display_order, is_active) VALUES
('m6', 'Module 6', 'Digital Safety & Online Protection', 'Safeguarding in digital learning environments',
'<!-- Content will be extracted from index.html -->', 6, true);

-- Module 6 Questions
INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m6', 'Participant accounts for digital platforms should use:',
 'Participant accounts must be created using Project STAR email domain — no personal accounts.', 0);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Personal email addresses', false, 0),
(currval('questions_id_seq'), 'Project STAR domain email addresses', true, 1),
(currval('questions_id_seq'), 'Social media logins', false, 2),
(currval('questions_id_seq'), 'Any email the participant prefers', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m6', 'Is staff communicating with participants via personal WhatsApp acceptable?',
 'Staff must NEVER communicate with participants via personal devices, accounts, or social media.', 1);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Yes, if it''s about programme activities', false, 0),
(currval('questions_id_seq'), 'Yes, with parent permission', false, 1),
(currval('questions_id_seq'), 'No, never', true, 2),
(currval('questions_id_seq'), 'Yes, for urgent matters', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m6', 'You discover a participant has been receiving inappropriate messages from an unknown adult online. You should:',
 'Immediately refer to DSL and statutory authorities. Preserve evidence carefully — do NOT forward images.', 2);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Delete the messages', false, 0),
(currval('questions_id_seq'), 'Forward the messages to colleagues', false, 1),
(currval('questions_id_seq'), 'Preserve evidence and refer immediately to DSL and statutory authorities', true, 2),
(currval('questions_id_seq'), 'Reply to the adult from the participant''s account', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m6', 'One-to-one digital mentoring requires:',
 'One-to-one mentoring needs DSL approval, parent/guardian consent, and sessions conducted via platform with recording.', 3);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'No special arrangements', false, 0),
(currval('questions_id_seq'), 'DSL approval and parent consent, with session recording', true, 1),
(currval('questions_id_seq'), 'Only verbal parent agreement', false, 2),
(currval('questions_id_seq'), 'The mentor''s discretion', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m6', 'During an online session, a participant posts offensive content in the chat. First response:',
 'Address the behaviour immediately, remind of Code of Conduct, and escalate to DSL if serious or repeated.', 4);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Publicly shame the participant', false, 0),
(currval('questions_id_seq'), 'Ignore it to avoid disruption', false, 1),
(currval('questions_id_seq'), 'Address behaviour immediately and remind of Code of Conduct', true, 2),
(currval('questions_id_seq'), 'End the session for everyone', false, 3);

-- ═══════════════════════════════════════════════════════════════
-- MODULE 7: Code of Conduct & Safe Recruitment
-- ═══════════════════════════════════════════════════════════════
INSERT INTO modules (module_id, num, title, description, content_html, display_order, is_active) VALUES
('m7', 'Module 7', 'Code of Conduct & Safe Recruitment', 'Professional boundaries, behaviour standards, and recruitment',
'<!-- Content will be extracted from index.html -->', 7, true);

-- Module 7 Questions
INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m7', 'A participant aged 17 expresses romantic interest in a staff member. The staff member should:',
 'Intimate or sexual relationships with participants — including those aged 16-17 — are strictly prohibited.', 0);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Reciprocate — the participant is nearly an adult', false, 0),
(currval('questions_id_seq'), 'Maintain professional boundaries — relationships with participants (including ages 16-17) are prohibited', true, 1),
(currval('questions_id_seq'), 'Report the participant for inappropriate behaviour', false, 2),
(currval('questions_id_seq'), 'Ask the parent for permission', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m7', 'How often are background checks renewed for ongoing staff roles?',
 'Background checks are repeated every three years for ongoing roles.', 1);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Annually', false, 0),
(currval('questions_id_seq'), 'Every 2 years', false, 1),
(currval('questions_id_seq'), 'Every 3 years', true, 2),
(currval('questions_id_seq'), 'Only at initial hiring', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m7', 'Can staff transport participants in their private vehicle?',
 'Transport in private vehicles is prohibited except in emergency with DSL authorisation.', 2);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Yes, always', false, 0),
(currval('questions_id_seq'), 'Yes, with parent permission', false, 1),
(currval('questions_id_seq'), 'No, except in emergency with DSL authorisation', true, 2),
(currval('questions_id_seq'), 'Yes, if another adult is present', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m7', 'What is the final safeguarding ''gate'' before someone can work with children?',
 'Pre-Employment Clearance — the DSL signs off safeguarding clearance as the final gate before employment.', 3);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Passing the interview', false, 0),
(currval('questions_id_seq'), 'DSL signs off safeguarding clearance', true, 1),
(currval('questions_id_seq'), 'Completing the application', false, 2),
(currval('questions_id_seq'), 'Getting references', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m7', 'A false declaration on the Self-Disclosure Form results in:',
 'False declaration is grounds for immediate dismissal and may be referred to authorities.', 4);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'A verbal warning', false, 0),
(currval('questions_id_seq'), 'Resubmission of the form', false, 1),
(currval('questions_id_seq'), 'Immediate dismissal and possible referral to authorities', true, 2),
(currval('questions_id_seq'), 'Probation extension', false, 3);

-- ═══════════════════════════════════════════════════════════════
-- MODULE 8: Training, Monitoring & Review
-- ═══════════════════════════════════════════════════════════════
INSERT INTO modules (module_id, num, title, description, content_html, display_order, is_active) VALUES
('m8', 'Module 8', 'Training, Monitoring & Review', 'Continuous improvement, audit, and multi-agency working',
'<!-- Content will be extracted from index.html -->', 8, true);

-- Module 8 Questions
INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m8', 'How long is the mandatory safeguarding induction for all staff?',
 'The mandatory safeguarding induction is a minimum of 3 hours.', 0);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), '1 hour', false, 0),
(currval('questions_id_seq'), '2 hours', false, 1),
(currval('questions_id_seq'), '3 hours', true, 2),
(currval('questions_id_seq'), '6 hours', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m8', 'How often does an independent safeguarding audit take place?',
 'Project STAR commissions an annual independent safeguarding audit.', 1);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Monthly', false, 0),
(currval('questions_id_seq'), 'Quarterly', false, 1),
(currval('questions_id_seq'), 'Annually', true, 2),
(currval('questions_id_seq'), 'Every 3 years', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m8', 'SSL specialist training is renewed every:',
 'SSL specialist training is renewed every 2 years.', 2);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'Year', false, 0),
(currval('questions_id_seq'), '2 years', true, 1),
(currval('questions_id_seq'), '3 years', false, 2),
(currval('questions_id_seq'), '5 years', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m8', 'Which agency receives mandatory referrals for FGM cases?',
 'FGM requires mandatory referral to police and/or social services.', 3);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'MoEST only', false, 0),
(currval('questions_id_seq'), 'JAMB', false, 1),
(currval('questions_id_seq'), 'Nigeria Police Force', true, 2),
(currval('questions_id_seq'), 'Health services only', false, 3);

INSERT INTO questions (module_id, question_text, explanation, display_order) VALUES
('m8', 'What is the PRIMARY purpose of learning from safeguarding incidents?',
 'The primary purpose is to prevent recurrence through policy updates, training improvements, and systemic changes.', 4);
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
(currval('questions_id_seq'), 'To assign blame', false, 0),
(currval('questions_id_seq'), 'To prevent recurrence through systemic improvement', true, 1),
(currval('questions_id_seq'), 'To satisfy regulators', false, 2),
(currval('questions_id_seq'), 'To discipline staff', false, 3);

-- ═══════════════════════════════════════════════════════════════
-- Verification
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
  module_count INTEGER;
  question_count INTEGER;
  option_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO module_count FROM modules;
  SELECT COUNT(*) INTO question_count FROM questions;
  SELECT COUNT(*) INTO option_count FROM question_options;

  RAISE NOTICE '✅ Seed migration complete!';
  RAISE NOTICE '   Modules inserted: %', module_count;
  RAISE NOTICE '   Questions inserted: %', question_count;
  RAISE NOTICE '   Options inserted: %', option_count;
  RAISE NOTICE '   Expected: 8 modules, 40 questions, 160 options';
END $$;
