from pathlib import Path
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf" / "ayurnidaan-screen-catalog.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

GREEN = HexColor("#075A3F")
DARK = HexColor("#24312B")
CREAM = HexColor("#FBF8EF")
GOLD = HexColor("#B58428")
MINT = HexColor("#EAF3EA")
PALE = HexColor("#FFF5DF")
MUTED = HexColor("#65716A")
LINE = HexColor("#D9DED7")

screens = [
    ("Onboarding", "Brand splash", "Ayurnidaan", "AI-powered Ayurveda for Personalized Health", [], "Tap to continue", "splash"),
    ("Onboarding", "Welcome and sign in", "Welcome to Ayurnidaan", "Personalized health guidance combining Ayurveda, modern health information and AI", ["Continue with Google", "Mobile and email options shown as UI"], "Continue with Google", "auth"),
    ("Onboarding", "Create account", "Tell us about you", "Step 1 of 2", ["Full name", "Terms and Privacy acceptance"], "Continue", "form"),
    ("Onboarding", "Basic profile", "Create your profile", "Step 2 of 2", ["Date of birth", "Sex: Male / Female", "Height and weight"], "Continue", "form"),
    ("Onboarding", "Profile confirmation", "Welcome!", "Explore Ayurnidaan and unlock personalized guidance", ["Profile created successfully"], "Go to Home", "success"),
    ("Home", "Assessments pending", "Good Morning", "Complete Your Assessments", ["1  Prakriti Assessment", "2  Current Health Assessment", "Explore Ayurnidaan"], "Start Now", "home"),
    ("Home", "Personalized home", "Good Morning", "Your current balance", ["Prakriti donut and major doshas", "Current Vikriti insight", "Appointment reminder", "Today's Plan"], "View guidance", "home"),
    ("Prakriti", "Assessment introduction", "Understand Your Natural Health Pattern", "Your unique mind-body constitution", ["25 Questions", "Takes a few minutes", "Natural tendencies"], "Start Assessment", "intro"),
    ("Prakriti", "Questionnaire", "Prakriti Assessment", "Question 1 of 25", ["How would you describe your natural body build?", "Image + option A", "Image + option B", "Image + option C"], "Continue", "question"),
    ("Prakriti", "Assessment result", "Your Prakriti", "Vata - Pitta Dominant", ["Dosha donut chart", "Vata / Pitta / Kapha percentages", "Meaning and natural tendencies"], "Continue to Home", "result"),
    ("Current Health", "Assessment introduction", "How Are You Feeling Right Now?", "Share your symptoms for personalized guidance", ["Symptoms", "Lifestyle and health habits", "Medications and conditions"], "Start Assessment", "intro"),
    ("Current Health", "Vikriti conversation", "Current Health Assessment", "A conversational Vikriti assessment", ["Describe your main complaint", "Five adaptive AI questions", "Final: Any more complaints?"], "Send", "chat"),
    ("Current Health", "Health profile ready", "Your Personalized Health Profile is Ready!", "Profile generated from your information", ["Basic Profile", "Prakriti Assessment", "Current Health Assessment"], "Go to Home", "success"),
    ("Doctor", "Doctor directory", "Talk to a Doctor", "Connect with experienced Ayurveda doctors", ["Dr Nikhil Khatana", "Dr Lalit Madawat", "Dr Nirmal Kumavat"], "View All Doctors", "doctors"),
    ("Doctor", "Doctor profile", "Dr Nikhil Khatana", "BAMS, MD (Ayu) - Ayurveda", ["About", "8 years experience", "Consultation Fee: Rs 600"], "Book Appointment", "doctor"),
    ("Doctor", "Select date and time", "Select Date & Time", "Bookings available for the next 3 months", ["Monthly calendar", "10:00 AM  11:00 AM", "04:00 PM  05:00 PM"], "Confirm Appointment", "calendar"),
    ("Doctor", "Appointment confirmed", "Appointment Confirmed!", "Dr Nikhil Khatana", ["Selected date and time", "Video Consultation", "Details saved"], "Go to My Appointments", "success"),
    ("AI", "Ayurnidaan AI", "Ayurnidaan AI", "Your Ayurveda wellness assistant", ["User message bubbles", "Assistant responses", "Keyboard-aware composer"], "Send", "chat"),
    ("Shop", "Shop home", "Shop", "Search and delivery address", ["Compact category filters", "Recommended for You", "Best Sellers", "Previously Ordered", "Explore products"], "Open Cart", "shop"),
    ("Shop", "Product details", "Product Details", "Ashwagandha - 500 mg", ["Product visual and rating", "Price and MRP", "Description", "Inline quantity control"], "Add to Cart", "product"),
    ("Shop", "Cart", "My Cart", "Review quantities before checkout", ["Ashwagandha x 1", "Triphala x 2", "Total: Rs 1,097"], "Checkout", "cart"),
    ("Shop", "Delivery addresses", "Delivery Address", "Choose where your order should arrive", ["Home - selected", "Office", "+ Add a new address"], "Confirm Address", "address"),
    ("Shop", "Add address", "Add New Address", "Delivery details", ["Label and recipient", "Address line", "City and state", "Postcode"], "Save Address", "form"),
    ("Shop", "Order confirmation", "Order Successfully Placed!", "Your wellness products are being prepared", ["Tap anywhere to return to the shop"], "Return to Shop", "success"),
    ("Profile", "My Health Profile", "My Health Profile", "Name and profile picture", ["Your Prakriti and description", "Your Vikriti and key symptoms", "Disease vulnerability", "Profile and account options"], "View and edit profile", "profile"),
    ("Profile", "Edit profile", "Edit Profile", "Personal and body details", ["Profile picture", "Full name and date of birth", "Sex", "Height and weight"], "Save Changes", "form"),
    ("Profile", "Account settings", "Account Settings", "Preferences and privacy consent", ["Notifications", "Diet", "Health personalisation", "AI context", "Doctor Sharing"], "Save Changes", "settings"),
    ("Profile", "My orders", "My Orders", "Newest orders first", ["Order number and date", "Status and item count", "Total amount"], "Open Order", "list"),
    ("Profile", "Order details", "Order Details", "Items, quantities and total", ["Products ordered", "Total amount", "Order Confirmed", "Packed / Shipped / Delivered"], "", "tracking"),
    ("Profile", "My appointments", "My Appointments", "Booked consultations", ["Doctor", "Date and time", "Consultation type"], "Open Appointment", "list"),
    ("Profile", "Appointment details", "Appointment Details", "Doctor and consultation details", ["Discussion Summary", "Prescription"], "", "appointment"),
]

questions = [
 ("How would you describe your natural body build?", "Thin or lean, with visible joints", "Medium and balanced", "Broad, heavy or muscular"),
 ("How does your skin usually feel?", "Dry, rough or thin", "Soft and warm; gets red or irritated easily", "Thick, smooth, oily and cool"),
 ("What is your appetite usually like?", "Changes often and feels unpredictable", "Strong; I get irritable if food is late", "Slow and steady; I can skip a meal easily"),
 ("Which weather bothers you the most?", "Cold, dry and windy", "Hot and humid", "Cold and damp"),
 ("How much do you usually sweat?", "Very little", "A lot, often with a strong smell", "A moderate and steady amount"),
 ("What is your natural hair like?", "Dry, thin, frizzy or breaks easily", "Fine and soft; turned grey early", "Thick, oily, wavy and dense"),
 ("How would you describe your eyes?", "Small, dry or often moving", "Medium, sharp and sensitive to bright light", "Large, moist and calm"),
 ("What is your stamina usually like?", "Strong for a short time, then tired quickly", "Moderate and focused", "Slow to start, but lasts a long time"),
 ("How does your body usually recover?", "Slowly and unpredictably; small illnesses happen often", "Quickly after treatment; swelling or heat is common", "Illness starts slowly and I rarely get sick"),
 ("What is your sleep usually like?", "Light and easily disturbed", "Sound but usually shorter", "Deep and heavy; waking up is difficult"),
 ("How do you usually learn and remember?", "Learn quickly but also forget quickly", "Remember details clearly and logically", "Learn slowly but remember for a long time"),
 ("How do you usually make decisions?", "I decide quickly, then often change my mind", "I decide fast and confidently", "I take time, then stay firm"),
 ("How do you react under pressure?", "I become worried or restless", "I become irritated or intense", "I stay calm and steady"),
 ("How would you describe your voice and speaking style?", "Fast, changing tone; very talkative at times", "Sharp, clear and confident", "Slow, deep, steady and gentle"),
 ("What are your bones and joints like?", "Light bones with visible joints", "Medium build", "Thick, heavy and strong bones"),
 ("What is your natural skin tone?", "Dusky or brown", "Reddish, copper or yellow", "Fair, pale and even"),
 ("What are your nails usually like?", "Dry, rough and break easily", "Soft, pink and grow quickly", "Thick, smooth, shiny and grow slowly"),
 ("What are your teeth and gums naturally like?", "Uneven teeth, with gaps or some teeth sticking out", "Medium teeth; yellowish, gums bleed easily", "Large, strong, white teeth with firm gums"),
 ("How do you usually walk?", "Quick, light and sometimes uneven", "Fast, purposeful and confident", "Slow, steady and grounded"),
 ("How does your weight usually change?", "It is hard for me to gain weight", "My weight stays steady easily", "I gain weight easily and lose it slowly"),
 ("What were you like as a child?", "Thin, restless and ate little", "Medium build, strong hunger and competitive", "Well-built, calm and had a good appetite"),
 ("Which traits are common in your family?", "Lean build, quick nature and changing moods", "Strong nature, early grey hair and ambition", "Heavier build, calm nature and easy weight gain"),
 ("What are your bowel movements usually like?", "Irregular, dry or hard; constipation is common", "Soft or loose and more frequent", "Well-formed and regular"),
 ("How often do you feel thirsty?", "It changes and feels unpredictable", "I feel very thirsty often", "I feel little thirst and can go long without water"),
 ("Which tastes do you naturally prefer?", "Sweet, sour and salty", "Sweet, bitter and dry tastes; less spicy or sour", "Spicy, bitter and dry tastes"),
]

def fit_lines(text, font, size, width):
    words = text.split()
    lines, current = [], ""
    for word in words:
        trial = f"{current} {word}".strip()
        if stringWidth(trial, font, size) <= width:
            current = trial
        else:
            if current: lines.append(current)
            current = word
    if current: lines.append(current)
    return lines

def draw_text(c, text, x, y, width, size=9, color=DARK, font="Helvetica", leading=None, max_lines=8):
    c.setFillColor(color); c.setFont(font, size)
    leading = leading or size * 1.25
    lines = fit_lines(text, font, size, width)[:max_lines]
    for line in lines:
        c.drawString(x, y, line); y -= leading
    return y

def rounded(c, x, y, w, h, fill, radius=10, stroke=LINE):
    c.setFillColor(fill); c.setStrokeColor(stroke); c.roundRect(x, y, w, h, radius, fill=1, stroke=1)

def draw_phone(c, x, y, w, h, spec):
    section, label, title, subtitle, items, button, variant = spec
    c.setFillColor(HexColor("#EEF0EC")); c.roundRect(x+4, y-4, w, h, 25, fill=1, stroke=0)
    c.setFillColor(CREAM); c.setStrokeColor(DARK); c.setLineWidth(1.5); c.roundRect(x, y, w, h, 25, fill=1, stroke=1)
    c.setFillColor(DARK); c.setFont("Helvetica-Bold", 7); c.drawString(x+18, y+h-17, "9:41")
    c.setFillColor(MUTED); c.setFont("Helvetica", 6); c.drawRightString(x+w-18, y+h-17, "signal  wifi  battery")
    inner_x, inner_w = x+17, w-34
    top = y+h-42
    if variant == "splash":
        c.setFillColor(GREEN); c.roundRect(x+1, y+1, w-2, h-2, 24, fill=1, stroke=0)
        logo = ROOT / "assets" / "ayurnidaan-logo.png"
        if logo.exists(): c.drawImage(ImageReader(str(logo)), x+42, y+h/2-45, w-84, 95, preserveAspectRatio=True, mask='auto')
        draw_text(c, title.upper(), x+35, y+h/2-58, w-70, 15, white, "Helvetica-Bold", 18, 2)
        draw_text(c, subtitle, x+35, y+h/2-82, w-70, 7, HexColor("#D6E5DC"), "Helvetica", 10, 3)
    else:
        if variant in ("home", "chat"):
            c.setFillColor(GREEN); c.roundRect(x+1, y+h-112, w-2, 111, 24, fill=1, stroke=0)
            title_color = white
        else: title_color = DARK
        top = draw_text(c, title, inner_x, top, inner_w, 13, title_color, "Helvetica-Bold", 15, 4) - 3
        top = draw_text(c, subtitle, inner_x, top, inner_w, 7, HexColor("#D4E5DB") if variant in ("home", "chat") else MUTED, "Helvetica", 10, 4) - 8
        if variant == "doctors":
            names = ["nikhil-khatana.jpeg", "lalit-madawat.jpeg", "nirmal-kumavat.jpeg"]
            for i, item in enumerate(items):
                top -= 64; rounded(c, inner_x, top, inner_w, 56, white, 9)
                p = ROOT / "doc-dp" / names[i]
                if p.exists(): c.drawImage(ImageReader(str(p)), inner_x+7, top+8, 40, 40, preserveAspectRatio=False, mask='auto')
                draw_text(c, item, inner_x+55, top+36, inner_w-62, 8, DARK, "Helvetica-Bold", 10, 2)
        elif variant == "question":
            top = draw_text(c, items[0], inner_x, top, inner_w, 10, DARK, "Helvetica-Bold", 12, 3) - 7
            for i in range(3):
                top -= 67; rounded(c, inner_x, top, inner_w, 60, white, 8)
                p = ROOT / "assets" / "options" / f"q01-{'abc'[i]}.webp"
                if p.exists(): c.drawImage(ImageReader(str(p)), inner_x+1, top+1, 70, 58, preserveAspectRatio=False, mask='auto')
                draw_text(c, items[i+1], inner_x+78, top+35, inner_w-87, 7, DARK, "Helvetica-Bold", 9, 3)
        elif variant == "profile":
            for idx, item in enumerate(items):
                hh = 67 if idx < 2 else 58
                top -= hh+7; rounded(c, inner_x, top, inner_w, hh, MINT if idx != 1 else PALE, 10)
                draw_text(c, item, inner_x+10, top+hh-18, inner_w-20, 7.5, DARK, "Helvetica-Bold", 10, 4)
        else:
            for idx, item in enumerate(items):
                hh = 34 if variant in ("form", "settings", "list") else 42
                top -= hh+7; rounded(c, inner_x, top, inner_w, hh, white if idx % 2 == 0 else MINT, 8)
                draw_text(c, item, inner_x+10, top+hh-15, inner_w-20, 7.5, DARK, "Helvetica-Bold" if idx == 0 else "Helvetica", 9, 3)
        if button:
            rounded(c, inner_x, y+28, inner_w, 30, GREEN, 8, GREEN)
            c.setFillColor(white); c.setFont("Helvetica-Bold", 8); c.drawCentredString(x+w/2, y+39, button)
        if variant in ("home", "shop", "doctors", "profile", "chat"):
            c.setFillColor(white); c.rect(x+1, y+1, w-2, 22, fill=1, stroke=0)
            c.setFillColor(MUTED); c.setFont("Helvetica", 5.5); c.drawCentredString(x+w/2, y+8, "Home     Doctor       AI       Shop      Profile")
    c.setFillColor(DARK); c.setFont("Helvetica-Bold", 8); c.drawCentredString(x+w/2, y-15, f"{section} - {label}")

W, H = landscape(A4)
c = canvas.Canvas(str(OUT), pagesize=(W,H))
c.setTitle("Ayurnidaan Mobile App - Screen Catalog")

def page_header(title, subtitle, page_no):
    c.setFillColor(CREAM); c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(GREEN); c.rect(0,H-56,W,56,fill=1,stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold",20); c.drawString(34,H-34,title)
    c.setFillColor(HexColor("#D5E7DC")); c.setFont("Helvetica",8); c.drawRightString(W-34,H-33,subtitle)
    c.setFillColor(MUTED); c.setFont("Helvetica",7); c.drawRightString(W-28,16,f"Ayurnidaan screen catalog  |  {page_no}")

# Cover
c.setFillColor(GREEN); c.rect(0,0,W,H,fill=1,stroke=0)
logo = ROOT / "assets" / "ayurnidaan-logo.png"
if logo.exists(): c.drawImage(ImageReader(str(logo)), 55, H-250, 255, 160, preserveAspectRatio=True, mask='auto')
c.setFillColor(white); c.setFont("Helvetica-Bold",31); c.drawString(55,H-285,"Mobile App Screen Catalog")
c.setFillColor(HexColor("#D3E5DA")); c.setFont("Helvetica",13); c.drawString(56,H-315,"Current development build - React Native + Expo")
c.setFillColor(GOLD); c.roundRect(56,95,350,55,12,fill=1,stroke=0)
c.setFillColor(white); c.setFont("Helvetica-Bold",12); c.drawString(76,126,"31 distinct screens documented")
c.setFont("Helvetica",9); c.drawString(76,109,"Includes the complete 25-question Prakriti content inventory")
c.showPage()

page = 2
for start in range(0, len(screens), 3):
    page_header("Screen catalog", "Current implemented layouts", page)
    group = screens[start:start+3]
    for i, spec in enumerate(group):
        draw_phone(c, 33+i*270, 60, 230, 455, spec)
    c.showPage(); page += 1

for start in range(0, len(questions), 5):
    page_header("Prakriti question inventory", "Exact content used in the current build", page)
    y = H-83
    for index, q in enumerate(questions[start:start+5], start=start+1):
        rounded(c, 35, y-83, W-70, 76, white, 9)
        c.setFillColor(GREEN); c.setFont("Helvetica-Bold",10); c.drawString(49,y-24,f"Q{index:02d}")
        draw_text(c, q[0], 88, y-23, W-140, 9, DARK, "Helvetica-Bold", 11, 2)
        draw_text(c, f"A. {q[1]}    |    B. {q[2]}    |    C. {q[3]}", 88, y-49, W-140, 7.5, MUTED, "Helvetica", 10, 3)
        y -= 91
    c.showPage(); page += 1

c.save()
print(OUT)
