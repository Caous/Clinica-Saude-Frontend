import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import WhatsappTableLeadComponent from "../../components/tables/WhatsappTableLeadComponent/WhatsappTableLeadComponent";

export default function BasicTables() {
  return (
    <>
      <PageMeta
        title="WhatsappLead"
        description="Página do sistema, para gerenciamento de lead"
      />
      <PageBreadcrumb pageTitle="Whatsapp" />
      <div className="space-y-6">
        <ComponentCard title="Atendimentos">
          <WhatsappTableLeadComponent />
        </ComponentCard>
      </div>
    </>
  );
}
