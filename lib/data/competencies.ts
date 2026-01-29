export type RecommendedMedia = 'simulation' | 'text' | 'image' | 'hybrid';

export interface SubCompetency {
    id: string;
    title: string;
    recommendedMedia: RecommendedMedia;
    researchTip: string;
}

export interface Competency {
    id: string;
    title: string;
    description: string;
    subCompetencies: SubCompetency[];
}

export const COMPETENCIES_DATA: Competency[] = [
    {
        id: "comp-1",
        title: "สมรรถนะที่ 1",
        description: "การจัดการตนเอง (Self-Management)",
        subCompetencies: [
            {
                id: "sub-1-1",
                title: "การเห็นตระหนักในตนเองและจัดการตนเอง",
                recommendedMedia: "text",
                researchTip: "แนะนำให้ใช้ Text (Reflective Scenarios) เนื่องจากสถานการณ์สะท้อนคิดช่วยให้นักเรียนแสดงออกถึงกลยุทธ์การกำกับตนเอง (Self-regulation Strategies) ได้อย่างเหมาะสม"
            },
            {
                id: "sub-1-2",
                title: "การมีเป้าหมายและวางแผนชีวิต",
                recommendedMedia: "text",
                researchTip: "แนะนำให้ใช้ Text (Case Studies) เนื่องจากกรณีศึกษาเกี่ยวกับการตัดสินใจช่วยประเมินความสามารถในการวางแผนและกำหนดเป้าหมายได้ชัดเจน"
            },
            {
                id: "sub-1-3",
                title: "การมีสติและรู้ตัว",
                recommendedMedia: "text",
                researchTip: "แนะนำให้ใช้ Text (Situational Judgement Tests) เนื่องจากแบบทดสอบสถานการณ์ช่วยประเมินความสามารถในการตระหนักรู้และตอบสนองต่อสถานการณ์อย่างมีสติ"
            }
        ]
    },
    {
        id: "comp-2",
        title: "สมรรถนะที่ 2",
        description: "การคิดขั้นสูงและการแก้ปัญหา (Critical Thinking & Problem Solving)",
        subCompetencies: [
            {
                id: "sub-2-1",
                title: "การคิดวิจารณญาณ (Critical Thinking)",
                recommendedMedia: "text",
                researchTip: "แนะนำให้ใช้ Text (Argument Analysis) เนื่องจากการวิเคราะห์ข้อโต้แย้งต้องอาศัยการอ่านและประเมินหลักฐานอย่างละเอียด"
            },
            {
                id: "sub-2-2",
                title: "การคิดเชิงระบบ (System Thinking)",
                recommendedMedia: "hybrid",
                researchTip: "แนะนำให้ใช้ Hybrid (Simulation + Text) เนื่องจากการคิดเชิงระบบต้องอาศัยทั้งการจำลองสถานการณ์เพื่อแสดงความสัมพันธ์ซับซ้อน และข้อความอธิบายบริบทเพื่อให้เข้าใจภาพรวมของระบบ"
            },
            {
                id: "sub-2-3",
                title: "การคิดสร้างสรรค์ (Creative Thinking)",
                recommendedMedia: "simulation",
                researchTip: "แนะนำให้ใช้ Simulation (Sandbox Environment) เนื่องจากสภาพแวดล้อมแบบเปิดช่วยให้นักเรียนทดลองอย่างอิสระ (Open-ended Experimentation)"
            },
            {
                id: "sub-2-4",
                title: "การแก้ปัญหา (Problem Solving)",
                recommendedMedia: "simulation",
                researchTip: "แนะนำให้ใช้ Simulation เนื่องจากการลองผิดลองถูกในสภาพแวดล้อมที่ปลอดภัย (Trial-and-error in Safe Environment) เป็นหัวใจสำคัญของการประเมินทักษะแก้ปัญหา"
            }
        ]
    },
    {
        id: "comp-3",
        title: "สมรรถนะที่ 3",
        description: "การสื่อสาร (Communication)",
        subCompetencies: [
            {
                id: "sub-3-1",
                title: "การรับและส่งสาร",
                recommendedMedia: "text",
                researchTip: "แนะนำให้ใช้ Text (Comprehension & Summarization Tasks) เนื่องจากงานทำความเข้าใจและสรุปความเหมาะสำหรับประเมินทักษะการรับส่งสาร"
            },
            {
                id: "sub-3-2",
                title: "การเลือกใช้สื่อและเทคโนโลยี",
                recommendedMedia: "simulation",
                researchTip: "แนะนำให้ใช้ Simulation เนื่องจากการใช้เครื่องมือดิจิทัลเพื่อสื่อความหมาย (Using Digital Tools to Convey Meaning) ต้องอาศัยการปฏิบัติจริง"
            },
            {
                id: "sub-3-3",
                title: "ความฉลาดรู้ทางดิจิทัล (Digital Literacy)",
                recommendedMedia: "simulation",
                researchTip: "แนะนำให้ใช้ Simulation (Fake News Verification Scenarios) เนื่องจากสถานการณ์ตรวจสอบข่าวปลอมช่วยประเมินความสามารถในการรู้เท่าทันสื่อดิจิทัล"
            }
        ]
    },
    {
        id: "comp-4",
        title: "สมรรถนะที่ 4",
        description: "การรวมพลังทำงานเป็นทีม (Teamwork & Collaboration)",
        subCompetencies: [
            {
                id: "sub-4-1",
                title: "การเป็นผู้นำและสมาชิกที่ดี",
                recommendedMedia: "text",
                researchTip: "แนะนำให้ใช้ Text (Role-playing Scenarios) เนื่องจากสถานการณ์สวมบทบาทช่วยประเมินความสามารถในการเป็นผู้นำและสมาชิกทีมที่ดี"
            },
            {
                id: "sub-4-2",
                title: "การจัดการความขัดแย้ง",
                recommendedMedia: "text",
                researchTip: "แนะนำให้ใช้ Text (Dilemma Scenarios) เนื่องจากสถานการณ์กลืนไม่เข้าคายไม่ออกต้องอาศัยการใช้เหตุผลเชิงจริยธรรม (Ethical Reasoning)"
            }
        ]
    },
    {
        id: "comp-5",
        title: "สมรรถนะที่ 5",
        description: "การเป็นพลเมืองที่เข้มแข็ง (Active Citizenship)",
        subCompetencies: [
            {
                id: "sub-5-1",
                title: "การเคารพกติกาและสิทธิหน้าที่",
                recommendedMedia: "text",
                researchTip: "แนะนำให้ใช้ Text (Legal/Social Scenarios) เนื่องจากสถานการณ์ทางกฎหมายและสังคมช่วยประเมินความเข้าใจในสิทธิและหน้าที่พลเมือง"
            },
            {
                id: "sub-5-2",
                title: "การรับผิดชอบต่อสังคม",
                recommendedMedia: "text",
                researchTip: "แนะนำให้ใช้ Text (Environmental Impact Case Studies) เนื่องจากกรณีศึกษาผลกระทบสิ่งแวดล้อมช่วยประเมินความรับผิดชอบต่อสังคมและธรรมชาติ"
            }
        ]
    },
    {
        id: "comp-6",
        title: "สมรรถนะที่ 6",
        description: "การอยู่ร่วมกับธรรมชาติและวิทยาการอย่างยั่งยืน (Living with Nature & Science)",
        subCompetencies: [
            {
                id: "sub-6-1",
                title: "การเข้าใจปรากฏการณ์โลกและเอกภพ",
                recommendedMedia: "simulation",
                researchTip: "แนะนำให้ใช้ Simulation เนื่องจากการแสดงภาพเคลื่อนไหว (Dynamic Visualizations) ช่วยให้นักเรียนเข้าใจปรากฏการณ์ที่เป็นนามธรรมหรือมองไม่เห็นได้ดีกว่าข้อความคงที่"
            },
            {
                id: "sub-6-2",
                title: "การเชื่อมโยงคณิตศาสตร์/วิทยาศาสตร์",
                recommendedMedia: "hybrid",
                researchTip: "แนะนำให้ใช้ Hybrid (Simulation + Text) เนื่องจากการเชื่อมโยงคณิตศาสตร์และวิทยาศาสตร์ต้องอาศัยทั้ง Simulation สำหรับจัดการข้อมูล/สร้างกราฟ และข้อความอธิบายบริบทปัญหาในโลกจริง"
            },
            {
                id: "sub-6-3",
                title: "การรู้เท่าทันวิทยาการ",
                recommendedMedia: "simulation",
                researchTip: "แนะนำให้ใช้ Simulation (Technology Impact Analysis) เนื่องจากการวิเคราะห์ผลกระทบเทคโนโลยีต้องอาศัยการโต้ตอบกับระบบจำลอง"
            },
            {
                id: "sub-6-4",
                title: "คุณลักษณะทางวิทย์เพื่อความยั่งยืน",
                recommendedMedia: "text",
                researchTip: "แนะนำให้ใช้ Text (Socio-Scientific Issues) เนื่องจากประเด็นทางสังคมที่เกี่ยวข้องกับวิทยาศาสตร์ช่วยประเมินเจตคติและค่านิยมเพื่อความยั่งยืน"
            }
        ]
    }
];

export const getCompetencyById = (id: string): Competency | undefined => {
    return COMPETENCIES_DATA.find(c => c.id === id);
};

export const getSubCompetencyById = (competencyId: string, subId: string): SubCompetency | undefined => {
    const competency = getCompetencyById(competencyId);
    return competency?.subCompetencies.find(s => s.id === subId);
};

export const getAllCompetencyOptions = () => {
    return COMPETENCIES_DATA.map(c => ({
        value: c.id,
        label: `${c.title}: ${c.description}`
    }));
};

export const getSubCompetencyOptions = (competencyId: string) => {
    const competency = getCompetencyById(competencyId);
    if (!competency) return [];
    return competency.subCompetencies.map(s => ({
        value: s.id,
        label: s.title
    }));
};
