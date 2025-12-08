import { useLanguage } from "../contexts/LanguageContext";
import "./LanguageSwitcher.css";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${language === "en" ? "active" : ""}`}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
      <button
        className={`lang-btn ${language === "vi" ? "active" : ""}`}
        onClick={() => setLanguage("vi")}
      >
        VI
      </button>
    </div>
  );
};

export default LanguageSwitcher;
