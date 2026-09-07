from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer,
    Table, TableStyle, KeepTogether
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf" / "Ayurnidaan-Terms-Privacy-Consent-v5.0.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

FONT_DIR = Path(r"C:\Windows\Fonts")
pdfmetrics.registerFont(TTFont("AyuSans", str(FONT_DIR / "arial.ttf")))
pdfmetrics.registerFont(TTFont("AyuSans-Bold", str(FONT_DIR / "arialbd.ttf")))
pdfmetrics.registerFont(TTFont("AyuSerif", str(FONT_DIR / "georgia.ttf")))
pdfmetrics.registerFont(TTFont("AyuSerif-Bold", str(FONT_DIR / "georgiab.ttf")))

GREEN = colors.HexColor("#164D39")
DEEP = colors.HexColor("#102F27")
GOLD = colors.HexColor("#C99535")
CREAM = colors.HexColor("#F8F5EC")
MINT = colors.HexColor("#E8F2EB")
INK = colors.HexColor("#263B32")
MUTED = colors.HexColor("#66776F")
LINE = colors.HexColor("#DCD7CC")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="BodyAyu", fontName="AyuSans", fontSize=8.4, leading=12.6, textColor=INK, alignment=TA_JUSTIFY, spaceAfter=5.5))
styles.add(ParagraphStyle(name="SmallAyu", fontName="AyuSans", fontSize=7.2, leading=10.5, textColor=MUTED, spaceAfter=4))
styles.add(ParagraphStyle(name="H1Ayu", fontName="AyuSerif", fontSize=21, leading=25, textColor=DEEP, spaceBefore=8, spaceAfter=10, keepWithNext=True))
styles.add(ParagraphStyle(name="H2Ayu", fontName="AyuSerif", fontSize=13.5, leading=17, textColor=GREEN, spaceBefore=9, spaceAfter=5, keepWithNext=True))
styles.add(ParagraphStyle(name="H3Ayu", fontName="AyuSans-Bold", fontSize=8.8, leading=12, textColor=INK, spaceBefore=6, spaceAfter=3, keepWithNext=True))
styles.add(ParagraphStyle(name="TableHeadAyu", fontName="AyuSans-Bold", fontSize=8.4, leading=11, textColor=colors.white, spaceAfter=0))
styles.add(ParagraphStyle(name="BulletAyu", parent=styles["BodyAyu"], leftIndent=11, firstLineIndent=-6, bulletIndent=2, spaceAfter=3))
styles.add(ParagraphStyle(name="CalloutAyu", fontName="AyuSans", fontSize=8.1, leading=12, textColor=DEEP, backColor=MINT, borderColor=colors.HexColor("#BFD3C6"), borderWidth=0.5, borderPadding=8, spaceBefore=6, spaceAfter=8))
styles.add(ParagraphStyle(name="TOCHeading", fontName="AyuSerif", fontSize=22, leading=27, textColor=DEEP, spaceAfter=12))
styles.add(ParagraphStyle(name="TOC1", fontName="AyuSans", fontSize=8.5, leading=12, leftIndent=0, firstLineIndent=0, textColor=INK))
styles.add(ParagraphStyle(name="TOC2", fontName="AyuSans", fontSize=7.5, leading=10.5, leftIndent=14, firstLineIndent=0, textColor=MUTED))

class TermsDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(filename, pagesize=A4, leftMargin=19*mm, rightMargin=19*mm, topMargin=22*mm, bottomMargin=18*mm, title="Ayurnidaan Terms of Use, Privacy Notice and Consent", author="Ayurnidaan Health Pvt Ltd", subject="Terms of Use and DPDP-aligned Privacy Notice")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates(PageTemplate(id="terms", frames=frame, onPage=self.decorate))

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            style = flowable.style.name
            if style == "H1Ayu":
                text = flowable.getPlainText()
                key = "h1-%s" % self.seq.nextf("h1")
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=0, closed=False)
                self.notify("TOCEntry", (0, text, self.page, key))
            elif style == "H2Ayu":
                text = flowable.getPlainText()
                key = "h2-%s" % self.seq.nextf("h2")
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=1, closed=False)
                self.notify("TOCEntry", (1, text, self.page, key))

    def decorate(self, canvas, doc):
        canvas.saveState()
        if doc.page > 1:
            canvas.setStrokeColor(LINE)
            canvas.setLineWidth(0.4)
            canvas.line(19*mm, 282*mm, 191*mm, 282*mm)
            canvas.setFont("AyuSans-Bold", 7)
            canvas.setFillColor(GREEN)
            canvas.drawString(19*mm, 286*mm, "AYURNIDAAN")
            canvas.setFont("AyuSans", 6.8)
            canvas.setFillColor(MUTED)
            canvas.drawRightString(191*mm, 286*mm, "Terms of Use, Privacy Notice and Consent | Version 5.0")
            canvas.line(19*mm, 14*mm, 191*mm, 14*mm)
            canvas.drawString(19*mm, 9.5*mm, "Effective 6 September 2026 | Formal draft for counsel review")
            canvas.drawRightString(191*mm, 9.5*mm, f"Page {doc.page}")
        canvas.restoreState()

def p(text, style="BodyAyu"):
    return Paragraph(text, styles[style])

def bullet(text):
    return Paragraph("- " + text, styles["BulletAyu"])

def h1(text):
    return Paragraph(text, styles["H1Ayu"])

def h2(text):
    return Paragraph(text, styles["H2Ayu"])

def h3(text):
    return Paragraph(text, styles["H3Ayu"])

def section(title, paragraphs, subsections=None):
    story.append(h1(title))
    for text in paragraphs:
        story.append(p(text))
    for subtitle, items in (subsections or []):
        story.append(h2(subtitle))
        for item in items:
            story.append(bullet(item) if item.startswith("BULLET:") else p(item.replace("BULLET:", "")))

def data_table(rows, widths=(38*mm, 48*mm, 72*mm)):
    data = [[p("Category", "TableHeadAyu"), p("Examples currently processed", "TableHeadAyu"), p("Purpose and use", "TableHeadAyu")]]
    for row in rows:
        data.append([p(row[0], "SmallAyu"), p(row[1], "SmallAyu"), p(row[2], "SmallAyu")])
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), GREEN), ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("GRID", (0,0), (-1,-1), 0.35, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("BACKGROUND", (0,1), (-1,-1), colors.white),
    ]))
    story.append(table)
    story.append(Spacer(1, 7))

story = []

# Cover
story.append(Spacer(1, 25*mm))
story.append(Paragraph("AYURNIDAAN", ParagraphStyle(name="CoverBrand", fontName="AyuSans-Bold", fontSize=11, leading=14, textColor=GOLD, letterSpacing=2, alignment=TA_CENTER)))
story.append(Spacer(1, 8*mm))
story.append(Paragraph("Terms of Use,<br/>Privacy Notice<br/>and Consent", ParagraphStyle(name="CoverTitle", fontName="AyuSerif", fontSize=32, leading=39, textColor=DEEP, alignment=TA_CENTER)))
story.append(Spacer(1, 8*mm))
story.append(Paragraph("Version 5.0 | Effective 6 September 2026", ParagraphStyle(name="CoverVersion", fontName="AyuSans-Bold", fontSize=9, leading=13, textColor=GREEN, alignment=TA_CENTER)))
story.append(Spacer(1, 18*mm))
story.append(p("This document governs use of the Ayurnidaan application and gives the itemised privacy notice intended to support informed consent under the Digital Personal Data Protection Act, 2023 and the Digital Personal Data Protection Rules, 2025. It should be read in full before the onboarding confirmations are selected.", "CalloutAyu"))
story.append(Spacer(1, 10*mm))
cover_table = Table([[p("Data Fiduciary", "SmallAyu"), p("Ayurnidaan Health Pvt Ltd", "SmallAyu")], [p("Privacy and grievance contact", "SmallAyu"), p("hello@ayurnidaan.com", "SmallAyu")], [p("Service territory", "SmallAyu"), p("India", "SmallAyu")]], colWidths=[54*mm, 104*mm])
cover_table.setStyle(TableStyle([("BOX",(0,0),(-1,-1),0.5,LINE),("INNERGRID",(0,0),(-1,-1),0.35,LINE),("BACKGROUND",(0,0),(0,-1),CREAM),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),("TOPPADDING",(0,0),(-1,-1),7),("BOTTOMPADDING",(0,0),(-1,-1),7)]))
story.append(cover_table)
story.append(Spacer(1, 13*mm))
story.append(p("Important: Ayurnidaan is a wellness and facilitation platform. It is not an emergency service and does not replace diagnosis, treatment, or medical judgment by a qualified clinician. If you may be experiencing an emergency, call 112 or your local emergency service or attend the nearest hospital.", "CalloutAyu"))
story.append(PageBreak())

# TOC
story.append(Paragraph("Contents", styles["TOCHeading"]))
toc = TableOfContents()
toc.levelStyles = [styles["TOC1"], styles["TOC2"]]
story.append(toc)
story.append(PageBreak())

section("1. Document structure, acceptance and priority", [
    "These Terms of Use, Privacy Notice and Consent Record (collectively, the <b>Terms</b>) form a binding agreement between the individual who accesses or uses Ayurnidaan (<b>you</b>, <b>your</b>, or <b>Data Principal</b>) and Ayurnidaan Health Pvt Ltd (<b>Ayurnidaan</b>, <b>we</b>, <b>us</b>, <b>our</b>, or <b>Data Fiduciary</b>). They apply to the mobile application, related web experiences, hosted application programming interfaces, customer support, assessments, recommendations, consultations, marketplace, payment facilitation, and associated services.",
    "By creating an account, selecting the onboarding confirmations, or continuing to use the Service after these Terms are presented, you confirm that you have read and understood them, that the information you provide is accurate to the best of your knowledge, and that you agree to be bound by the contractual provisions. Consent to personal data processing is separately described and may be withdrawn as explained in Part II. Withdrawal does not affect processing already carried out lawfully before withdrawal.",
    "If a product-specific notice, consultation consent, payment notice, or just-in-time permission prompt conflicts with these Terms, the more specific notice governs only for that particular processing activity. Mandatory law prevails over any inconsistent contractual term. Headings aid navigation and do not limit interpretation."
], [("1.1 Version control and legal status", [
    "This version is dated 6 September 2026. The Digital Personal Data Protection Act, 2023 and the Digital Personal Data Protection Rules, 2025 have phased commencement dates. Ayurnidaan intends this notice to meet the substantive standards for clear notice, specified purpose, consent, safeguards, grievance handling, and Data Principal rights as those provisions become applicable.",
    "This is a formal product draft based on the code, database schema, and service integrations reviewed on the version date. Legal entity details, registered office, grievance officer designation, retention implementation, processor contracts, and any sector-specific health, telemedicine, consumer, tax, and e-commerce obligations must be validated by Indian legal counsel before production publication."
])])

section("2. Eligibility, capacity and children", [
    "The consumer Service is intended for persons who are at least 18 years old and competent to contract under Indian law. You must not create an independent account for a child or provide a child's personal data unless Ayurnidaan has introduced an age-appropriate flow that obtains verifiable consent from the child's parent or lawful guardian and satisfies the restrictions applicable to tracking, behavioural monitoring, and targeted advertising directed at children.",
    "If the date of birth supplied indicates that the user is below 18, Ayurnidaan may suspend onboarding, request age assurance or verifiable parental consent, limit features, or delete data that cannot lawfully be processed. A parent or guardian who believes a child has supplied data without proper consent should contact hello@ayurnidaan.com."
])

section("3. The Ayurnidaan Service", [
    "Ayurnidaan provides Ayurvedic wellness tools and facilitates access to independent practitioners and wellness products. Current features may include Prakriti assessment, conversational Vikriti or current-health assessment, AI Vaidya chat, personalised food, yoga and supplement recommendations, meal-image recognition, nutrition tracking, doctor discovery and appointment booking, pre-consultation symptom notes and report uploads, profile and consent controls, product browsing and ordering, payment facilitation, order and appointment history, and support by email.",
    "Features may be added, changed, suspended, or withdrawn to improve safety, comply with law, address technical limitations, or reflect commercial availability. Material changes affecting personal data purposes or user rights will be notified and, where required, fresh consent will be requested."
])

section("4. Health, medical and emergency limitations", [
    "Ayurnidaan content is educational and supportive wellness information. It is not a medical diagnosis, prescription, emergency assessment, or assurance of a particular outcome. Automated dosha scores, symptom groupings, nutritional estimates, food plans, yoga plans, supplement suggestions, and red-flag classifiers can be incomplete, probabilistic, or incorrect.",
    "Do not delay urgent care because of anything displayed by the Service. Where a message may indicate chest pain, severe breathing difficulty, stroke signs, fainting, seizure, severe bleeding, anaphylaxis, poisoning, overdose, self-harm, or another urgent concern, the AI chat may stop and present a doctor or emergency prompt. The safeguard cannot identify every emergency and does not create a duty to monitor you continuously.",
    "Consult a qualified practitioner before following recommendations if you have a diagnosed condition, take medication, are pregnant or breastfeeding, are preparing for surgery, have allergies, have persistent or worsening symptoms, or are unsure whether an exercise or product is suitable. Stop yoga or other activity if you experience pain, dizziness, breathing difficulty, weakness, or distress."
])

section("5. Accounts, authentication and user responsibilities", [
    "Account access currently uses Google sign-in through Supabase authentication. Google and Supabase process authentication identifiers and technical records under their own terms and privacy documentation. You are responsible for your Google account security, device lock, network security, and all activity conducted through your authenticated session unless you promptly report unauthorised access.",
    "You must provide complete and accurate information, keep it updated, and not impersonate another person. Date of birth, sex, height, weight, diet preference, health goals, assessment responses, symptoms, and reports materially affect recommendations. Ayurnidaan is not responsible for reduced relevance caused by inaccurate, incomplete, outdated, or misleading information.",
    "You may not sell, transfer, share, or permit unauthorised use of your account. Notify hello@ayurnidaan.com promptly if you suspect compromise, mistaken identity, or unauthorised processing."
])

section("6. Assessments and personalised recommendations", [
    "Prakriti and Vikriti assessments are based on answers and conversational inputs you choose to provide. Percentage scores, dosha labels, conclusions, symptom lists, and recommendation plans are generated using fixed logic and/or AI systems. They are wellness classifications, not validated clinical diagnoses.",
    "Food, yoga, and supplement recommendations use the most recent assessment context and may use age, sex, height, weight, diet preference, goals, and symptoms where the relevant feature and consent setting allow. Recommendations should be independently evaluated for allergies, intolerances, physical limitations, medication interactions, religious or ethical preferences, and advice from a qualified professional.",
    "Nutritional values inferred from meal photographs are estimates. Portion size, ingredients, cooking method, and image quality can materially alter the result. You should edit or disregard a result that appears incorrect."
])

section("7. AI Vaidya and automated processing", [
    "AI Vaidya sends the conversation and selected assessment context to Ayurnidaan's hosted function and then to OpenRouter, which routes requests to the configured language or vision model provider. Prakriti, Vikriti, and recorded symptoms are included in AI chat context. Age, height, and weight are additionally included only when the AI context setting is enabled. Meal photographs are sent to the configured vision model when you choose scan or upload.",
    "AI output may contain errors, omissions, bias, outdated information, hallucinations, or unsuitable suggestions. You must not rely on it as the sole basis for medical, financial, legal, or safety-critical decisions. Ayurnidaan may apply input validation, response schemas, safety classifiers, retry logic, output filtering, and human review, but these measures do not guarantee accuracy.",
    "Do not enter secrets, payment credentials, government identifiers, or another person's personal data in chat unless strictly necessary and lawfully authorised. Human support or authorised technical personnel may access limited records when required to investigate a reported defect, security incident, abuse, or rights request, subject to role-based access and confidentiality."
])

section("8. Doctor discovery, consultations and clinical responsibility", [
    "Ayurnidaan helps users discover practitioners, view profiles, submit symptom notes and tags, upload reports or symptom photographs, choose a consultation slot, and maintain appointment records. A practitioner is independently responsible for registration, professional judgment, diagnosis, advice, prescriptions, recordkeeping, and compliance with professional and telemedicine obligations.",
    "Doctor rankings may consider selected symptom tags, specialty match, availability, and star rating. A ranking is not an endorsement, guarantee, or representation that a doctor is suitable for every condition. You remain responsible for choosing the practitioner and verifying any credentials important to you.",
    "Pre-consultation notes and uploaded files are intended to be disclosed to the practitioner selected for that consultation. You should upload only relevant information and remove unrelated third-party information. Consultation details may include date, time, type, status, discussion summary, and prescription. Emergencies must not be booked through the routine appointment flow."
])

section("9. Shop, products, delivery and returns", [
    "The shop displays Ayurvedic and wellness products, recommendations, prices, descriptions, ratings, stock and delivery estimates. Recommendations are informational and do not establish medical suitability. Product labels, warnings, expiry information, ingredients, allergens, dosage directions, manufacturer information, and practitioner advice take priority over app descriptions.",
    "An order is an offer to purchase and is accepted only when confirmed for fulfilment. Prices, taxes, promotions, coupons, delivery availability, and timelines may change before acceptance. Ayurnidaan may cancel or limit an order for stock, safety, fraud, pricing error, geographic restriction, or legal compliance and will provide any remedy required by applicable consumer law.",
    "Returns, refunds, replacements, and cancellations are subject to the policy displayed at purchase and mandatory law, including restrictions that may apply to opened, personalised, perishable, or health-related products. Delivery partners may receive recipient name, phone number, address, order reference, and delivery instructions strictly for fulfilment."
])

section("10. Payments", [
    "Where payment processing is enabled, Razorpay processes payment initiation, payment method selection, UPI app handoff, gateway authentication, and payment confirmation. Ayurnidaan receives transaction references, order identifiers, status, amount, currency, timestamps, limited failure information, and the resource linked to the payment. Ayurnidaan does not intend to store full card numbers, CVV, UPI PIN, or banking credentials.",
    "Current product builds may operate in a temporary test or bypass mode in which no payment is collected and an appointment or order is confirmed locally or in the application data store. The checkout screen will indicate the applicable mode. Never share a UPI PIN, one-time password, card PIN, or banking password with Ayurnidaan personnel or practitioners.",
    "Payment disputes, reversals, chargebacks, refunds, and settlement timing may depend on Razorpay, banks, card networks, UPI participants, and applicable law. You authorise required transaction information to be shared with those parties for the requested payment and fraud prevention."
])

section("11. Uploads and user content", [
    "User content includes chat text, assessment answers, symptoms, reports, photographs, profile images, reviews or feedback, addresses, support communications, and other material you submit. You retain ownership of your user content. You grant Ayurnidaan a limited, non-exclusive, worldwide, royalty-free licence to host, reproduce, transmit, transform, and display it only as reasonably necessary to operate, secure, improve, and support the Service and meet legal obligations.",
    "You represent that you have the rights and permissions necessary to upload the content and that it is accurate, relevant, and lawful. You must not upload malware, unlawful content, confidential information belonging to another person, or medical records for which you lack authority. Ayurnidaan may block, quarantine, or remove content where necessary for security, rights protection, legal compliance, or enforcement of these Terms."
])

section("12. Acceptable use", [
    "You must not misuse the Service, circumvent access controls, probe or attack infrastructure, scrape protected data, reverse engineer except where law expressly permits, interfere with another user, submit fraudulent transactions, manipulate ratings, impersonate a doctor, use automated output to provide unlicensed clinical services, or use the Service for unlawful discrimination, harassment, exploitation, or harm.",
    "You must not attempt to access another user's profile, assessment, report, appointment, order, payment reference, or address. Security research must be authorised in writing. Ayurnidaan may investigate suspected abuse, preserve evidence, limit features, suspend access, notify affected persons, or cooperate with lawful authorities."
])

section("13. Intellectual property", [
    "The Service, brand, software, interfaces, text, graphics, databases, recommendation structures, and non-user content are owned by or licensed to Ayurnidaan and protected by applicable intellectual property law. Subject to these Terms, Ayurnidaan grants you a personal, limited, revocable, non-exclusive, non-transferable licence to use the consumer application for lawful personal purposes.",
    "No licence is granted to use Ayurnidaan trademarks, extract databases, reproduce practitioner content, train competing systems on protected output, or commercialise recommendations. Feedback may be used without restriction or compensation provided it is not publicly attributed to you without permission."
])

section("14. Third-party services and links", [
    "The Service depends on third parties including Google, Supabase, OpenRouter and configured model providers, Razorpay, app stores, device operating systems, practitioners, and potential logistics providers. Their systems may be unavailable, changed, or governed by separate terms. Ayurnidaan is responsible for selecting processors and giving required instructions where it acts as Data Fiduciary, but is not responsible for independent processing performed by a third party for its own purposes.",
    "Opening an email application, UPI application, browser, app store, map, or external link leaves the controlled Ayurnidaan interface. Review the receiving service's privacy and security information before continuing."
])

section("15. Suspension, termination and account closure", [
    "You may stop using the Service at any time and may request account closure through hello@ayurnidaan.com. Ayurnidaan may suspend or terminate access for material breach, fraud, security risk, unlawful conduct, threats to another person, repeated misuse, non-payment, or discontinuation of the Service, subject to notice where reasonably practicable and legally required.",
    "Account closure does not automatically erase records that must be retained for consultations, prescriptions, orders, payments, tax, fraud prevention, dispute resolution, legal claims, or regulatory obligations. Data no longer required for a lawful purpose will be erased or de-identified in accordance with the retention section."
])

section("16. Disclaimers, liability and indemnity", [
    "To the maximum extent permitted by law, the Service is provided on an 'as available' basis without implied guarantees of uninterrupted availability, error-free operation, fitness for a medical purpose, or particular wellness outcome. Nothing excludes statutory consumer rights that cannot lawfully be excluded.",
    "To the maximum extent permitted by law, Ayurnidaan will not be liable for indirect, incidental, special, exemplary, or consequential loss, loss of opportunity, or loss arising from reliance on automated wellness content, practitioner conduct, product misuse, inaccurate user data, unauthorised account access caused by your failure to protect credentials, or third-party service interruption. Any contractual cap must not apply where prohibited by law, including liability for fraud, wilful misconduct, or obligations that cannot be limited.",
    "You agree to indemnify Ayurnidaan against third-party claims arising from unlawful user content, misuse of another person's data, account abuse, infringement of rights, or material breach of these Terms, except to the extent caused by Ayurnidaan's own breach or misconduct."
])

section("17. Governing law, disputes and notices", [
    "These Terms are governed by the laws of India. Parties should first attempt good-faith resolution through hello@ayurnidaan.com. This clause does not restrict your right to approach a consumer commission, the Data Protection Board of India, a court, regulator, law-enforcement authority, or another forum available under mandatory law.",
    "Service notices may be delivered in-app, to the email associated with Google sign-in, by push notification where enabled, or through another contact method you provide. You are responsible for keeping contact information current."
])

story.append(PageBreak())
story.append(h1("PART II - PRIVACY NOTICE UNDER THE DPDP FRAMEWORK"))
story.append(p("This Part provides a standalone, itemised account of the personal data processed, the specific purposes, disclosures, choices, safeguards, retention practices, and methods for exercising rights. It should be understandable independently of the contractual clauses above."))

section("18. Data Fiduciary and scope", [
    "Ayurnidaan Health Pvt Ltd is the Data Fiduciary for personal data processed to operate the consumer Service, except where a practitioner, payment provider, identity provider, app store, or other third party independently determines its own purposes and means. The current privacy and grievance contact is hello@ayurnidaan.com.",
    "This notice covers digital personal data collected directly in the application, received from Google authentication, generated from your activity, stored locally on your device, or processed by service providers on Ayurnidaan's instructions. It does not cover anonymous information that cannot identify you, or independent third-party processing outside Ayurnidaan's control."
])

story.append(h1("19. Itemised personal data and purposes"))
data_table([
    ("Account and identity", "Google account identifier, email, display name, authentication tokens, user ID, account timestamps.", "Create and secure the account, authenticate sessions, prevent misuse, link records, communicate service notices."),
    ("Profile and contact", "Full name, mobile number, date of birth, sex, profile photograph.", "Personalise the profile, calculate age, support appointments and orders, verify identity for requests, contact you where needed."),
    ("Body and preference data", "Height, weight, derived BMI, diet preference, health goals, notification and privacy settings.", "Display health profile, tailor food and wellness guidance, respect optional AI context and sharing choices."),
    ("Prakriti assessment", "Twenty-five answers, Vata/Pitta/Kapha scores and percentages, dominant Prakriti, completion time.", "Calculate and display natural constitution results and provide baseline context for recommendations."),
    ("Vikriti/current health", "Symptoms, free-text conversation, domain answers, lifestyle, sleep and stress information, imbalance flags, conclusion, completion time.", "Conduct current-health assessment, produce result, identify urgent language, and generate personalised plans."),
    ("AI chat", "Prompts, conversation history, Prakriti, Vikriti and symptoms; age, height and weight only if AI context is enabled.", "Generate AI Vaidya replies, apply safety classification, maintain conversational context, troubleshoot failures."),
    ("Meal and nutrition", "Meal photographs submitted for scanning, identified foods, serving estimates, calories, protein, fat, meal timing and intake history.", "Recognise meal components, estimate nutrition, log intake, display progress, improve next recommendations."),
    ("Wellness plans", "Generated food recipes and tags, favour/limit lists, yoga practices and reasons, supplement suggestions, model name, user ratings and comments.", "Deliver and review personalised recommendations and improve output quality."),
    ("Doctor and consultation", "Selected tags, symptom notes, PDF reports, symptom photos, doctor selection, date/time/type/status, discussion summary and prescription.", "Match and book practitioners, give the chosen practitioner relevant context, maintain appointment and follow-up history."),
    ("Shop and delivery", "Cart contents, products, quantity, price, order history, recipient name, address, city, state, postcode and default-address status.", "Maintain cart, recommend products, place and fulfil orders, provide history, handle support and returns."),
    ("Payment", "Purpose, amount, currency, Razorpay order/payment references, status, timestamps, linked resource, limited failure details.", "Initiate and verify payment, reconcile orders or appointments, prevent fraud, process refunds and disputes. Full card or UPI credentials are not intended to be stored by Ayurnidaan."),
    ("Technical and security", "Device/app version, operating system, IP address, request metadata, session records, timestamps, error and security logs collected by infrastructure.", "Deliver the Service, diagnose faults, protect accounts, rate-limit misuse, investigate incidents and comply with lawful requests."),
    ("Support and feedback", "Email address, issue description, order/appointment number, attachments, ratings, comments and correspondence.", "Respond to support, investigate complaints, improve the Service and establish a record of resolution."),
    ("Device-local records", "Authentication session, persistent cart, temporary appointment/order confirmations and red-flag handoff text stored through device local storage.", "Keep you signed in, preserve cart and temporary records between screens or restarts, transfer urgent-context text into doctor intake."),
])

section("20. Sources of personal data", [
    "Most personal data is collected directly from you when you sign in, complete onboarding, answer assessments, chat, take or upload a photograph, upload a report, choose a practitioner, create an address, place an order, or contact support. Authentication identity is received from Google through Supabase. Practitioners may add consultation summaries or prescriptions. Razorpay may provide payment confirmation and status. Device and security metadata may be generated automatically by the application, operating system, hosting, authentication, and network infrastructure.",
    "Ayurnidaan does not currently integrate an advertising network or third-party behavioural analytics SDK in the reviewed application code. If that changes, the notice and consent choices must be updated before such processing begins."
])

section("21. Grounds and specified purposes for processing", [
    "Ayurnidaan processes personal data for lawful purposes connected with the Service you request and on the basis of consent where required under the DPDP Act. Certain processing may also be undertaken for a legitimate use expressly recognised by applicable law, such as voluntarily provided data for a specified purpose, compliance with law, responding to medical emergencies, employment-related purposes where relevant, or enforcement of legal claims. Ayurnidaan will not characterise a purpose as a legitimate use unless the statutory conditions are met.",
    "Core account, assessment, booking, order, security, and support data is necessary to provide the corresponding requested feature. Optional personalisation, AI profile context, notifications, and doctor-sharing settings are separately controllable. Refusal or withdrawal may disable only the dependent feature unless the data is essential to the entire account."
], [("21.1 Purpose limitation", [
    "Personal data will not be used for an unrelated purpose without a fresh notice and valid consent or another lawful basis. Ayurnidaan will not sell personal data. It will not use health content for third-party advertising or permit unrelated practitioner access.",
    "Ayurnidaan may create aggregated or de-identified statistics to evaluate reliability, demand, safety and product performance. Reasonable measures will be applied to prevent re-identification, and anonymous information will not be used to make decisions about an identifiable user."
])])

section("22. Consent controls and feature consequences", [
    "During onboarding, you are asked to confirm that personal data may be used for personalisation and recommendations and that you have read and agree to the Terms. When both confirmations are completed, the current application enables the privacy settings for health personalisation, AI context, doctor sharing, and notifications. You can later change supported settings under Privacy and consent.",
    "Health personalisation allows profile and assessment information to shape recommendations. AI context allows age, height and weight to be included in AI Vaidya requests in addition to Prakriti, Vikriti and symptoms. Doctor sharing allows relevant notes, tags and uploaded reports to be shared with the practitioner chosen by you. Notifications allow service reminders where notification delivery is implemented and permission is granted by the device.",
    "Turning off a setting applies prospectively and may not retract information already sent to a practitioner, model provider, payment network, or delivery partner for a request you initiated. You may separately request erasure, subject to lawful retention. Consent must be freely given, specific, informed, unconditional, and unambiguous, and may be withdrawn with ease comparable to the method used to give it."
])

section("23. AI and model-provider disclosure", [
    "OpenRouter receives AI prompts and routes them to the model configured by Ayurnidaan. The content may include current-health conversation, assessment results, symptoms, recommendation instructions, AI Vaidya messages, or a meal photograph. The exact downstream model provider can change through configuration. Ayurnidaan should maintain a current processor register and contractual controls governing confidentiality, retention, security, sub-processing, incident notice, and use of submitted content.",
    "Ayurnidaan does not intentionally authorise providers to use identifiable health prompts or meal photographs to train general-purpose models. Actual provider retention and training controls must be confirmed contractually and technically. Users should avoid unnecessary identifiers in free text or images."
])

section("24. Disclosure and recipients", [
    "Personal data is disclosed only as reasonably necessary for the specified purpose, under contract, on your instruction, with consent, or where required by law. Recipient categories currently or foreseeably include:",
    "Google for account authentication; Supabase and its infrastructure providers for authentication, database, storage, and serverless functions; OpenRouter and configured model providers for language and vision processing; Razorpay, banks, UPI applications, card networks and payment participants where payment is enabled; the practitioner you select and authorised clinical support personnel; delivery and logistics providers for fulfilled orders; email and support providers; professional advisers, auditors, insurers and incident responders under confidentiality; and public authorities or courts where disclosure is lawfully required.",
    "Ayurnidaan requires service providers acting on its behalf to process data only on documented instructions, protect confidentiality, apply appropriate safeguards, assist with rights and incidents, and delete or return data at the end of the service, subject to lawful retention."
])

section("25. Cross-border processing", [
    "Cloud, authentication, AI, payment, support, and model infrastructure may process or make personal data accessible outside India. Ayurnidaan will assess provider locations, contractual terms, security, and any restrictions notified by the Central Government under section 16 of the DPDP Act. Cross-border processing will not be undertaken to a restricted country or territory and will remain subject to applicable sectoral localisation obligations.",
    "Where a practitioner or fulfilment activity is India-specific, Ayurnidaan will limit disclosure to the information reasonably necessary for that activity."
])

section("26. Security safeguards", [
    "The reviewed implementation uses authenticated sessions, Supabase row-level security so users access their own records, private storage buckets for avatars and doctor-intake files, signed URLs for temporary file access, file type and size controls, server-side authentication checks, structured validation of AI output, and separation of payment credentials from application data.",
    "Ayurnidaan will maintain reasonable security safeguards appropriate to the nature and risk of the data, including access controls, least privilege, encryption in transit, encryption at rest where supported, key and secret management, logging, monitoring, vulnerability and dependency management, secure development review, backups, incident response, processor diligence, personnel confidentiality, and periodic access review.",
    "No electronic system is completely secure. You must secure your device, Google account, screen lock, email, and payment applications; install trusted updates; avoid shared or rooted devices where possible; and report suspected unauthorised access promptly."
])

section("27. Personal data breach response", [
    "A personal data breach includes unauthorised processing, accidental disclosure, acquisition, sharing, use, alteration, destruction, or loss of access that compromises confidentiality, integrity, or availability. Ayurnidaan will investigate, contain, remediate, preserve evidence, assess affected data and risk, and require processor cooperation.",
    "Where the applicable provisions are in force, Ayurnidaan will notify affected Data Principals and the Data Protection Board of India in the form, manner, and time required by the DPDP Act and Rules. Notices may describe the nature and extent of the breach, likely consequences, measures taken, user safety steps, and a contact point."
])

story.append(h1("28. Retention and erasure schedule"))
story.append(p("Ayurnidaan retains personal data only while required for the specified purpose or another lawful purpose. The schedule below is the intended operational standard and must be reconciled with final legal, clinical, tax, consumer, limitation, and processor requirements before launch."))
retention_rows = [
    ("Account and profile", "While active; erase or de-identify within 30 days after verified closure, except retained legal or security records."),
    ("Prakriti, Vikriti and wellness plans", "While the account is active and for up to 3 years after last activity, or earlier on valid erasure request unless required for an active service or claim."),
    ("AI chat and meal-scan content", "User-visible or stored chat data while active; transient provider inputs per contracted settings; erase or de-identify within 30 days after valid account-erasure request. Meal images are not intended to be stored by Ayurnidaan after analysis unless explicitly saved or uploaded elsewhere."),
    ("Doctor uploads and appointment records", "For the consultation lifecycle and up to 3 years after the last related consultation, or longer where the practitioner or applicable health law requires. Unattached draft uploads should be removed within 30 days."),
    ("Orders, invoices, delivery and payments", "For up to 8 financial years or the longer period required for tax, accounting, consumer, fraud, chargeback, or legal obligations."),
    ("Support and complaints", "Up to 3 years after closure, or longer while a dispute, investigation or legal hold remains open."),
    ("Security and infrastructure logs", "Normally up to 180 days, extended only for incident investigation, abuse prevention, or legal requirements."),
    ("Device-local cart and temporary data", "Until removed by the user, checkout completion where designed, logout/account change, app data clearing, or uninstall. Device backups may retain copies under operating-system controls."),
    ("Backups", "Protected rolling backups may persist for up to 90 additional days before overwrite, with access restricted to restoration and incident purposes."),
]
rt = Table([[p("Data class", "TableHeadAyu"), p("Intended retention rule", "TableHeadAyu")]] + [[p(a,"SmallAyu"), p(b,"SmallAyu")] for a,b in retention_rows], colWidths=[48*mm,110*mm], repeatRows=1)
rt.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),GREEN),("TEXTCOLOR",(0,0),(-1,0),colors.white),("GRID",(0,0),(-1,-1),0.35,LINE),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5)]))
story.append(rt)
story.append(p("When consent is withdrawn or a purpose ends, Ayurnidaan will erase the data and cause its processors to erase it unless retention is necessary for compliance with law, prevention or investigation of unlawful activity, protection of legal rights, fulfilment of an outstanding order or consultation, or another lawful purpose. Data subject to a legal hold is isolated from ordinary use."))

section("29. Data Principal rights", [
    "Subject to the DPDP Act, its commencement notifications, the Rules, identity verification, and lawful exceptions, you may request: (a) a summary of personal data being processed and the processing activities; (b) the identities of Data Fiduciaries and processors with whom the data has been shared, together with a description of the data; (c) correction of inaccurate or misleading data; (d) completion of incomplete data; (e) updating of outdated data; (f) erasure of data no longer required for the specified purpose; (g) withdrawal of consent; (h) grievance redressal; and (i) nomination of another individual to exercise rights in the event of death or incapacity.",
    "Profile details and privacy settings can be changed in the application where the control exists. For access, erasure, processor-sharing details, nomination, or unresolved correction, email hello@ayurnidaan.com from the account-associated email and clearly describe the request. Ayurnidaan may ask for proportionate identity verification and clarification needed to locate the data and prevent unauthorised disclosure.",
    "Ayurnidaan will acknowledge and respond within the period required by applicable law. A request may be restricted where law permits, including where data must be retained, disclosure would adversely affect another person's rights, or the request is fraudulent. Reasons and escalation options will be provided where required."
])

section("30. Duties of Data Principals", [
    "You must comply with applicable law, not impersonate another person, not suppress material information when providing data for a document or identifier, furnish only verifiably authentic information when exercising correction or erasure rights, and not register a false or frivolous grievance or complaint. These duties do not limit good-faith use of privacy rights."
])

section("31. Grievance redressal and escalation", [
    "Send privacy, account, safety, order, appointment, or Terms grievances to <b>hello@ayurnidaan.com</b> with the subject 'Privacy grievance' or 'Service grievance'. Include the account email, a concise description, relevant order or appointment reference, desired resolution, and supporting material that does not expose unnecessary personal data.",
    "Ayurnidaan will acknowledge the grievance, assign it for review, investigate relevant systems and providers, and communicate an outcome within the period published in the application and required by law. If you are dissatisfied after using Ayurnidaan's grievance mechanism, you may approach the Data Protection Board of India where the statutory conditions are met, or use another remedy available under consumer, civil, criminal, professional, or sectoral law.",
    "Current grievance contact: Grievance Officer, Ayurnidaan Health Pvt Ltd, hello@ayurnidaan.com. The officer's individual name, registered-office address, and escalation timeline must be confirmed and published before production launch."
])

section("32. Changes to this notice", [
    "Ayurnidaan may update these Terms to reflect law, regulatory guidance, security requirements, processors, features, commercial terms, or data practices. The version and effective date will be updated. Material changes will be notified in a clear manner and fresh consent will be obtained where the purpose or consent materially changes. Continued use cannot substitute for consent where law requires an affirmative action."
])

story.append(PageBreak())
story.append(h1("PART III - CONSENT RECORD AND USER ACKNOWLEDGEMENTS"))
story.append(h2("33. Personalisation consent"))
story.append(p("By selecting 'I allow my personal data to be used for personalisation and recommendations', you affirmatively consent to Ayurnidaan processing the itemised profile, body, preference, Prakriti, Vikriti, symptom, food-intake, plan, usage, and feedback data reasonably necessary to tailor food, yoga, supplement, doctor, and home-screen recommendations. You understand that turning off personalisation may make recommendations generic or unavailable and that withdrawal operates prospectively."))
story.append(h2("34. Terms acceptance"))
story.append(p("By selecting 'I have read and agree to the terms and conditions', you confirm that you have scrolled through this document, had a reasonable opportunity to read it, meet the eligibility requirements, understand the medical and AI limitations, and agree to the contractual Terms. This acceptance is distinct from optional consent settings and does not authorise unrelated processing."))
story.append(h2("35. Just-in-time permissions"))
story.append(p("Camera and photo-library permission is requested by the operating system when you choose meal scanning, profile image selection, or relevant upload. File access is requested when you choose a report or photograph. Payment-app handoff occurs only when you choose the payment method and continue. Denying a permission prevents only the dependent feature where technically possible."))
story.append(h2("36. Record of consent"))
story.append(p("Ayurnidaan may record the user identifier, document version, language, timestamp, selected statements, privacy-toggle state, device/app metadata, and subsequent changes or withdrawal to demonstrate notice and consent. The record is retained for the period necessary to establish compliance and resolve disputes."))

doc = TermsDoc(str(OUT))
doc.multiBuild(story)
print(OUT)
