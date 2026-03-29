import Header from "../_components/header/Header";
import Tabs from "../_components/header/Tabs";
import Main from "../_components/Main";
import EmailModal from "../_components/EmailModal";
import TabContent from "../_components/TabContent";

export default function DashboardPage() {
  return (
    <Main>
      <Header />
      <Tabs />
      <TabContent />
      <EmailModal />
    </Main>
  );
}
