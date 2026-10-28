import { LoginForm } from "@/components/LoginForm";
import { OFFICE, RTS_DAYS } from "@/lib/policy";

export default function LoginPage() {
  return (
    <main className="login">
      <section className="story">
        <span className="orb orb-a" aria-hidden="true" />
        <span className="orb orb-b" aria-hidden="true" />
        <div>
          <p className="eyebrow">तहसील {OFFICE.taluka}</p>
          <h1>निवाडा</h1>
          <p>
            नायब तहसीलदारांसाठी उत्पन्नाच्या दाखल्याची पंक्ती. आपले सरकारवर अर्ज दाखल होतो. तहसील लिपिक आणि अवल कारकून तपासतात.
            शेवटचा निर्णय या टेबलावर होतो, {RTS_DAYS} दिवसांत.
          </p>
          <p>सहाय्यक कागद, ओळख, उत्पन्न, जुना दाखला आणि तलाठी अहवाल तपासतो. शिफारस सांगतो. मंजूर, नामंजूर किंवा दुरुस्ती तुम्ही ठरवता.</p>
        </div>
        <ul>
          <li>{OFFICE.act}</li>
          <li>सेवा: {OFFICE.service}</li>
          <li>मुदत: {RTS_DAYS} दिवस</li>
          <li>नियुक्त अधिकारी: {OFFICE.designation}</li>
          <li>प्रथम अपील: {OFFICE.appellate}</li>
        </ul>
      </section>
      <section className="form-wrap">
        <LoginForm />
      </section>
    </main>
  );
}
