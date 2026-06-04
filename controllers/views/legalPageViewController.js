'use strict';

const { getBrandSettings } = require('../../services/appSettingsService');

const LAST_UPDATED = 'June 4, 2026';

const legalPages = {
  'terms-and-conditions': {
    title: 'Terms and Conditions',
    sections: [
      section('Acceptance of Terms', [
        'By accessing, purchasing, registering for, or using FitAccess, you agree to be bound by these Terms and Conditions, our Privacy Policy, Refund Policy, and any additional billing or checkout disclosures presented at the time of purchase.',
        'If you do not agree with these terms, do not access or use FitAccess.'
      ]),
      section('About FitAccess', [
        'FitAccess is a digital fitness membership platform that may provide access to workout plans, meal guidance, progress tracking tools, account features, AI Coach support, and related digital fitness content.',
        'FitAccess is not a medical provider, healthcare provider, dietitian, or emergency service. Content provided through FitAccess is for general informational, educational, and fitness guidance purposes only.'
      ]),
      section('Eligibility', [
        'You must be at least 18 years old, or the age of majority in your jurisdiction, to purchase or use FitAccess. By using FitAccess, you confirm that you have the legal authority to enter into this agreement.'
      ]),
      section('Health and Fitness Disclaimer', [
        'Before beginning any workout, nutrition, weight loss, wellness, or fitness program, you should consult a qualified physician or healthcare professional, especially if you have any medical condition, injury, pregnancy, dietary restriction, disability, or history of health concerns.',
        'You understand and agree that:'
      ], [
        'FitAccess does not provide medical advice.',
        'FitAccess does not diagnose, treat, prevent, or cure any disease or medical condition.',
        'Workout and nutrition content may not be suitable for everyone.',
        'You are responsible for using your own judgment and stopping any activity that causes pain, dizziness, discomfort, shortness of breath, or other concerning symptoms.',
        'You assume all risk connected with your use of FitAccess and any fitness, exercise, nutrition, or wellness activity.'
      ]),
      section('Membership Access', [
        'After purchase, members may receive access to a digital account, dashboard, email login, password reset, or other membership access method.',
        'You are responsible for keeping your login information secure. You may not share, resell, transfer, sublicense, or provide unauthorized access to your FitAccess account.',
        'FitAccess access is restricted to one device at a time. If you want to use FitAccess on another device, you must first log out from the currently active device before logging in on the new device.',
        'We may suspend or terminate access if we detect abuse, unauthorized sharing, fraud, chargeback abuse, payment failure, misuse of the platform, violation of these terms, or activity that may harm FitAccess or other users.'
      ]),
      section('One-Time Payment, Upsell, and Billing Terms', [
        'FitAccess is offered as a one-time digital membership purchase unless a checkout page clearly states otherwise before purchase.',
        'The exact price, included access, and any checkout or upsell terms will be shown before you complete your purchase.',
        'By completing your purchase, you authorize FitAccess, {companyNames}, and our payment processors to charge the payment method you provide one time for the amount shown at checkout.',
        'FitAccess does not charge automatic monthly fees for this offer. You will not be billed every month for this membership unless you separately purchase another product or offer that clearly discloses different billing terms.'
      ]),
      section('Free Trials and Promotional Offers', [
        'If FitAccess is offered with a free trial, discounted trial, promotional price, bundle, or upsell offer, the specific terms will be disclosed at checkout.',
        'Unless otherwise stated at checkout, promotional access is handled as a one-time payment and does not create automatic monthly billing.',
        'Promotional offers may be changed, limited, withdrawn, or discontinued at any time.'
      ]),
      section('Access Questions and Account Closure', [
        'Because this offer is a one-time digital membership purchase, there is no future monthly membership billing tied to this purchase.',
        'You may contact {supportEmail} if you need help with access, account closure, or support.',
        'Account closure does not automatically create a refund for prior charges unless required by law or approved under our Refund Policy.'
      ]),
      section('Payment Authorization', [
        'You represent and warrant that you are authorized to use the payment method provided. If a payment fails, is declined, is reversed, or results in a chargeback, we may suspend or terminate your access.',
        'You agree not to provide false billing information or make unauthorized purchases.'
      ]),
      section('Digital Product Nature', [
        'FitAccess provides digital access and online membership content. You acknowledge that once digital access is delivered, you may immediately receive access to protected content, tools, and services.',
        'Because FitAccess is a digital membership, refunds may be limited as described in our Refund Policy.'
      ]),
      section('User Responsibilities', ['You agree not to:'], [
        'Use FitAccess for unlawful purposes.',
        'Copy, scrape, distribute, resell, or exploit FitAccess content.',
        'Share your account with unauthorized users.',
        'Use FitAccess on more than one device at the same time or bypass single-device access restrictions.',
        'Attempt to bypass security, billing, or access controls.',
        'Upload malicious code or interfere with the website.',
        'Misrepresent your identity or payment information.',
        'Use FitAccess content as a substitute for medical, nutritional, or professional advice.',
        'Abuse support, refund, account closure, or chargeback processes.'
      ]),
      section('AI Coach Disclaimer', [
        'FitAccess may include AI-powered support or coaching features. AI responses are automated and may be incomplete, inaccurate, or unsuitable for your personal circumstances.',
        'AI Coach responses are not medical advice, nutritionist advice, professional training advice, or emergency guidance. Always use personal judgment and consult qualified professionals when needed.'
      ]),
      section('Nutrition and Meal Guidance Disclaimer', [
        'Any meal plans, calorie suggestions, macros, recipes, or nutrition guidance are general informational tools only. They may not account for allergies, medical conditions, medications, religious requirements, eating disorders, pregnancy, breastfeeding, or personal dietary needs.',
        'You are responsible for checking ingredients, allergens, nutrition suitability, and professional medical guidance before following any meal recommendation.'
      ]),
      section('Intellectual Property', [
        'All FitAccess content, including text, graphics, workout plans, meal guidance, images, designs, software, branding, account dashboards, and related materials, is owned by FitAccess, {companyNames}, or its licensors.',
        'You receive a limited, personal, non-transferable, non-exclusive license to access and use FitAccess for your own personal use only.',
        'You may not reproduce, sell, copy, distribute, publish, or commercially exploit any FitAccess content without written permission.'
      ]),
      section('Third-Party Services', [
        'FitAccess may use third-party providers for payment processing, hosting, analytics, email delivery, account access, fraud prevention, and other operational services.',
        'Your use of third-party tools may also be subject to their own terms and privacy policies.'
      ]),
      section('Availability and Changes', [
        'We may modify, update, suspend, discontinue, or replace any part of FitAccess at any time. We do not guarantee uninterrupted, error-free, or permanent access.',
        'We may update these Terms from time to time. Continued use of FitAccess after updates means you accept the revised Terms.'
      ]),
      section('No Guaranteed Results', [
        'FitAccess does not guarantee weight loss, muscle gain, improved health, fitness results, earnings, performance improvements, or any specific outcome. Results vary based on personal effort, consistency, diet, health, genetics, and other factors.',
        'Testimonials, examples, or marketing statements are not guarantees.'
      ]),
      section('Limitation of Liability', [
        'To the maximum extent permitted by law, FitAccess, {companyNames}, its owners, employees, contractors, partners, vendors, and affiliates shall not be liable for any indirect, incidental, consequential, special, punitive, or exemplary damages, including loss of data, injury, lost profits, lost opportunities, or dissatisfaction with results.',
        'Your use of FitAccess is at your own risk.'
      ]),
      section('Indemnification', [
        'You agree to defend, indemnify, and hold harmless FitAccess and {companyNames} from any claims, damages, losses, liabilities, costs, and expenses arising from your use of FitAccess, your violation of these Terms, your misuse of content, or your violation of any law or third-party right.'
      ]),
      section('Governing Law', [
        'These Terms are governed by the laws of the State of Indiana, United States, without regard to conflict of law principles, unless otherwise required by applicable consumer protection law.'
      ]),
      section('Contact', [
        'For questions about these Terms, billing, access, account closure, or support, contact:',
        '{supportEmail}'
      ])
    ]
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    sections: [
      section('Overview', [
        'This Privacy Policy explains how FitAccess and {companyNames} collect, use, disclose, and protect information when you visit our website, purchase a membership, access your account, contact support, or use our services.',
        'By using FitAccess, you agree to this Privacy Policy.'
      ]),
      section('Information We Collect', ['We may collect the following categories of information:'], [
        'Personal information you provide, such as name, email address, phone number, billing information, account details, and support messages.',
        'Payment-related information, such as transaction details, billing address, payment status, processor identifiers, and fraud prevention signals. Full card information is typically processed by third-party payment processors and may not be stored directly by us.',
        'Account and membership information, such as login status, purchase status, access history, active device status, account closure status, and support requests.',
        'Fitness-related information you choose to provide, such as goals, activity preferences, workout completion, meal preferences, progress logs, weight entries, and other information entered into the platform.',
        'Device and usage information, such as IP address, browser type, operating system, pages visited, referral source, time spent, clicks, and website interactions.',
        'Cookies and tracking information, including analytics, advertising, attribution, fraud prevention, and session cookies.'
      ]),
      section('How We Use Information', ['We may use information to:'], [
        'Provide FitAccess membership access.',
        'Process purchases, one-time payments, refunds, account access, account closure requests, and support.',
        'Send access emails, password resets, transactional notices, and service updates.',
        'Personalize workouts, meal guidance, progress tracking, and AI Coach interactions.',
        'Improve website performance, user experience, content, and support.',
        'Prevent fraud, chargeback abuse, unauthorized access, and security issues.',
        'Comply with legal, tax, accounting, regulatory, and payment processor requirements.',
        'Send marketing communications where permitted by law.',
        'Measure advertising performance and campaign attribution.'
      ]),
      section('How We Share Information', ['We may share information with:'], [
        'Payment processors and billing providers.',
        'Hosting, software, analytics, email, customer support, CRM, and security vendors.',
        'Fraud prevention and compliance providers.',
        'Professional advisors, including legal, accounting, tax, and business advisors.',
        'Government, regulatory, or law enforcement authorities if required by law.',
        'Business successors in connection with a merger, sale, acquisition, restructuring, or transfer of assets.',
        'We do not sell personal information for money.'
      ]),
      section('Cookies and Tracking', [
        'FitAccess may use cookies, pixels, tags, analytics tools, and similar technologies to operate the website, remember preferences, improve performance, prevent fraud, and measure marketing campaigns.',
        'You may adjust cookie settings in your browser. Some features may not work properly if cookies are disabled.'
      ]),
      section('Advertising and Analytics', [
        'We may use third-party analytics and advertising tools to understand website performance, measure conversions, attribute purchases, and improve marketing.',
        'These tools may collect device, usage, cookie, and interaction data. Your rights may vary depending on your location.'
      ]),
      section('Email and Communications', [
        'By purchasing or registering, you may receive transactional emails related to your account, purchase, billing, access, password resets, membership, support, or policy updates.',
        'Where permitted, you may also receive promotional emails. You can unsubscribe from promotional messages using the unsubscribe link, but you may still receive transactional or legal notices.'
      ]),
      section('Data Security', [
        'We use reasonable administrative, technical, and organizational safeguards designed to protect personal information. However, no system is completely secure, and we cannot guarantee absolute security.'
      ]),
      section('Data Retention', [
        'We retain information for as long as reasonably necessary to provide services, manage accounts, comply with legal obligations, resolve disputes, prevent fraud, enforce agreements, and maintain business records.'
      ]),
      section('Your Privacy Rights', ['Depending on your location, you may have rights to:'], [
        'Request access to personal information.',
        'Request correction of inaccurate information.',
        'Request deletion of certain information.',
        'Request restriction or objection to certain processing.',
        'Opt out of certain marketing communications.',
        'Opt out of certain sale or sharing of personal information where applicable.',
        'Request a copy of personal information in a portable format.',
        'To submit a privacy request, contact {supportEmail}.',
        'We may need to verify your identity before completing your request.'
      ]),
      section('California and U.S. State Privacy Notice', [
        'Residents of certain U.S. states may have additional rights regarding personal information, including rights to access, delete, correct, and opt out of certain data sharing or targeted advertising.',
        'To make a request, email {supportEmail} with the subject line "Privacy Request."'
      ]),
      section('Do Not Sell or Share My Personal Information', [
        'FitAccess does not sell personal information for money. Some analytics or advertising activities may be considered "sharing" or "targeted advertising" under certain privacy laws.',
        'To request an opt-out, email {supportEmail} with the subject line "Do Not Sell or Share Request."'
      ]),
      section('Children\'s Privacy', [
        'FitAccess is intended for adults and is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided personal information, contact us so we can review and remove it where appropriate.'
      ]),
      section('International Users', [
        'If you access FitAccess from outside the United States, your information may be processed in the United States or other countries where our service providers operate. By using FitAccess, you consent to such processing where permitted by law.'
      ]),
      section('Updates to This Policy', [
        'We may update this Privacy Policy from time to time. The updated version will be posted with a new "Last Updated" date.'
      ]),
      section('Contact', [
        'For privacy questions or requests, contact:',
        '{supportEmail}'
      ])
    ]
  },
  'refund-policy': {
    title: 'Refund Policy',
    sections: [
      section('Digital Membership Refund Policy', [
        'FitAccess is a digital membership service. Once access is delivered, members may immediately receive access to digital content, account features, workout plans, meal guidance, progress tools, and AI Coach support.',
        'Because access is digital, all charges are generally final unless otherwise required by law or expressly stated at checkout.'
      ]),
      section('Refund Requests', [
        'Refund requests may be reviewed on a case-by-case basis. To request a refund, contact {supportEmail} and include:'
      ], [
        'Full name',
        'Email used at purchase',
        'Order ID or transaction ID if available',
        'Date of purchase',
        'Reason for refund request',
        'Submitting a refund request does not guarantee approval.'
      ]),
      section('Account Closure', [
        'FitAccess is offered as a one-time digital membership purchase for this offer, so there is no automatic monthly billing tied to this purchase.',
        'You may contact {supportEmail} for account access help or account closure requests. Account closure does not automatically refund previous charges.'
      ]),
      section('Duplicate Charges or Billing Errors', [
        'If you believe you were charged in error, charged twice, or billed incorrectly, contact us as soon as possible at {supportEmail}.',
        'If we confirm a billing error, we may issue a refund or correction to the original payment method.'
      ]),
      section('Trial and Promotional Offers', [
        'If your purchase involved a trial, discounted trial, promotional rate, bundle, or upsell, the terms shown at checkout control the billing and refund treatment.',
        'Unless checkout clearly states otherwise, promotional access is handled as a one-time payment and does not create automatic monthly billing.'
      ]),
      section('Chargebacks', [
        'We encourage you to contact support before initiating a chargeback. Filing a chargeback may result in suspension or termination of your FitAccess account while the dispute is reviewed.',
        'We reserve the right to provide transaction records, checkout disclosures, access logs, account activity, and communications to payment processors, banks, and dispute resolution providers.'
      ]),
      section('Processing Approved Refunds', [
        'Approved refunds are typically issued back to the original payment method. Processing time may vary depending on your bank, card issuer, and payment processor.'
      ]),
      section('Contact', [
        'For refund or billing support, contact:',
        '{supportEmail}'
      ])
    ]
  },
  'do-not-sell-or-share': {
    title: 'Do Not Sell or Share My Personal Information',
    sections: [
      section('', [
        'FitAccess and {companyNames} do not sell personal information for money.',
        'Certain analytics, advertising, retargeting, tracking, or attribution technologies may be considered "sharing," "targeted advertising," or similar activity under some privacy laws.',
        'You may request to opt out of such activity by emailing:',
        '{supportEmail}',
        'Subject line: Do Not Sell or Share Request',
        'Please include the email address associated with your FitAccess account or purchase so we can process your request.',
        'We may need to verify your identity before fulfilling certain privacy requests.'
      ])
    ]
  },
  'billing-disclosure': {
    title: 'Billing Disclosure for Checkout / Upsell Page',
    sections: [
      section('', [
        'FitAccess is a digital fitness membership that provides access to workout guidance, meal guidance, progress tools, account features, and AI Coach support.',
        'By clicking the purchase button, you agree to the FitAccess Terms and Conditions, Privacy Policy, Refund Policy, and billing terms shown on this page.',
        'This offer is a one-time payment. Your payment method will be charged only the amount shown at checkout for this purchase, and there will be no automatic monthly membership billing for this offer.',
        'FitAccess access is restricted to one device at a time. To log in on another device, you must first log out from the currently active device.',
        'For billing, access, or account support, contact {supportEmail}.',
        'FitAccess is not medical advice. Consult a qualified healthcare professional before beginning any fitness, nutrition, or wellness program.'
      ])
    ]
  }
};

async function legalPageViewController(req, res, next)
{
  try
  {
    const page = legalPages[req.params.pageSlug];

    if (!page)
    {
      return next();
    }

    const brandSettings = await getBrandSettings();
    const supportEmail = brandSettings.support_email;
    const companyNames = brandSettings.company_names;
    const websiteUrl = brandSettings.website_url;

    return res.status(200).render('../views/legal-page.ejs', {
      legalData: {
        page: hydratePage(page, { supportEmail, companyNames, websiteUrl }),
        pages: legalPages,
        supportEmail,
        companyNames,
        websiteUrl,
        lastUpdated: LAST_UPDATED,
        currentUser: req.user || null
      },
      pageTitle: `FitAccess | ${page.title}`
    });
  }
  catch (error)
  {
    next(error);
  }
}

function section(title, paragraphs = [], bullets = [])
{
  return { title, paragraphs, bullets };
}

function hydratePage(page, replacements)
{
  return {
    ...page,
    sections: page.sections.map(item => ({
      title: item.title,
      paragraphs: item.paragraphs.map(text => hydrateText(text, replacements)),
      bullets: item.bullets.map(text => hydrateText(text, replacements))
    }))
  };
}

function hydrateText(text, replacements)
{
  return text
    .replaceAll('{supportEmail}', replacements.supportEmail)
    .replaceAll('{companyNames}', replacements.companyNames)
    .replaceAll('{websiteUrl}', replacements.websiteUrl);
}

module.exports = legalPageViewController;
