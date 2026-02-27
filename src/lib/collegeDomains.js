export const COLLEGE_DOMAINS = [
    // IITs
    "iitb.ac.in", "iitd.ac.in", "iitk.ac.in", "iitm.ac.in", "iitkgp.ac.in", "iitr.ac.in", "iitg.ac.in", "iith.ac.in",
    "iitj.ac.in", "iitgn.ac.in", "iitp.ac.in", "iitbbs.ac.in", "iitindore.ac.in", "iitmandi.ac.in", "iitrpr.ac.in",
    "iitv.ac.in", "iitbhilai.ac.in", "iitgoa.ac.in", "iitpkd.ac.in", "iittp.ac.in", "iitdh.ac.in", "iitjammu.ac.in", "iitbhw.ac.in",

    // NITs
    "nitw.ac.in", "nitt.edu", "nitk.ac.in", "nitrkl.ac.in", "nitc.ac.in", "vnit.ac.in", "nitjsr.ac.in", "nitp.ac.in",
    "nitkurukshetra.ac.in", "nits.ac.in", "nitdgp.ac.in", "nithamirpur.ac.in", "nitrr.ac.in", "nitmz.ac.in", "nitmanipur.ac.in",
    "nitm.ac.in", "nitnagaland.ac.in", "nitpy.ac.in", "nitsikkim.ac.in", "nitap.ac.in", "nitdelhi.ac.in", "nitgoa.ac.in",
    "nituk.ac.in", "nith.ac.in",

    // IIITs
    "iiit.ac.in", "iiitd.ac.in", "iiitb.ac.in", "iiita.ac.in", "iiitdmj.ac.in", "iiitdm.ac.in", "iiitg.ac.in", "iiitkota.ac.in",
    "iiitkualampur.ac.in", "iiitn.ac.in", "iiitp.ac.in", "iiitvadodara.ac.in", "iiits.ac.in", "iiitk.ac.in", "iiitunap.ac.in",

    // BITS
    "bits-pilani.ac.in", "bits-hyderabad.ac.in", "bits-goa.ac.in",

    // Private Universities
    "vit.ac.in", "vit.edu.in", "manipal.edu", "srmist.edu.in", "srmuniv.ac.in", "thapar.edu", "amity.edu", "lpu.in",
    "sharda.ac.in", "shivnadarfoundation.org", "snuchennai.edu.in", "bennett.edu.in", "chitkara.edu.in", "upes.ac.in",
    "graphicera.ac.in", "kiit.ac.in", "kluniversity.in", "pes.edu", "rvce.edu.in", "msrit.edu", "bmsce.ac.in",

    // Medical & Law
    "aiims.edu", "aiimsdelhi.ac.in", "mamc.ac.in", "nls.ac.in", "nludelhi.ac.in", "nalsar.ac.in",

    // Central & State Universities
    "du.ac.in", "jnu.ac.in", "bhu.ac.in", "uohyd.ac.in", "annauniv.edu", "amu.ac.in", "unipune.ac.in", "mu.ac.in",
    "caluniv.ac.in", "pondiuni.edu.in", "jmi.ac.in", "osmania.ac.in", "gauhati.ac.in", "kashmiruniversity.ac.in",
    "jammuuniversity.ac.in", "uok.ac.in", "rtu.ac.in", "ptu.ac.in", "mgu.ac.in", "cusat.ac.in"
];

export const isCollegeEmail = (email) => {
    if (!email) return false;
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return false;

    // Check if the domain is in our list or is a subdomain of a listed domain
    return COLLEGE_DOMAINS.some(d => domain === d || domain.endsWith("." + d));
};

export const getCollegeNameFromEmail = (email) => {
    if (!email) return "";
    const domain = email.split("@")[1]?.toLowerCase();

    // Simple mapping for common names, can be expanded
    if (domain.includes("iitb.ac.in")) return "IIT Bombay";
    if (domain.includes("iitd.ac.in")) return "IIT Delhi";
    if (domain.includes("iitk.ac.in")) return "IIT Kanpur";
    if (domain.includes("iitj.ac.in")) return "IIT Jodhpur";
    if (domain.includes("iitm.ac.in")) return "IIT Madras";
    if (domain.includes("iitkgp.ac.in")) return "IIT Kharagpur";
    if (domain.includes("iitr.ac.in")) return "IIT Roorkee";
    if (domain.includes("nitw.ac.in")) return "NIT Warangal";
    if (domain.includes("nitt.edu")) return "NIT Trichy";
    if (domain.includes("bits-pilani.ac.in")) return "BITS Pilani";

    // Fallback: extract name from domain
    let name = domain.split(".")[0].toUpperCase();
    return name;
};
