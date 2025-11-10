interface Group {
	latin: string;
	kiril: string;
	group: string[];
}

export class GroupCheck {
	private readonly allGroups: string[] = [
		//"Rahbariyat", "SGM", "Schetnaya palata", "Another"
		"Rahbariyat", "SGM", "Ekologiya", "Ekologiya - Chiqindi", "Schetnaya palata", "Another"
	]

	private readonly newGroups: Group[] = [
		{ latin: "Andijon viloyati", kiril: "Андижон вилояти", group: ['Andijon'] },
		{ latin: "Buxoro viloyati", kiril: "Бухоро вилояти", group: ['Buxoro'] },
		{ latin: "Farg'ona viloyati", kiril: "Фарғона вилояти", group: ["Farg'ona"] },
		{ latin: "Jizzax viloyati", kiril: "Жиззах вилояти", group: ['Jizzax'] },
		{ latin: "Namangan viloyati", kiril: "Наманган вилояти", group: ['Namangan'] },
		{ latin: "Navoiy viloyati", kiril: "Навоий вилояти", group: ['Navoiy'] },
		{ latin: "Qashqadaryo viloyati", kiril: "Қашқадарё вилояти", group: ['Qashqadaryo'] },
		{ latin: "Qoraqalpogiston Respublikasi", kiril: "Қорақалпогистон Республикаси", group: ["Qoraqalpogiston"] },
		{ latin: "Samarqand viloyati", kiril: "Самарқанд вилояти", group: ['Samarqand'] },
		{ latin: "Sirdaryo viloyati", kiril: "Сирдарё вилояти", group: ['Sirdaryo'] },
		{ latin: "Surxondaryo viloyati", kiril: "Сурхондарё вилояти", group: ['Surxondaryo'] },
		{ latin: "Toshkent viloyati", kiril: "Тошкент вилояти", group: ['Toshkent viloyati'] },
		{ latin: "Toshkent shahar", kiril: "Тошкент шаҳар", group: ['Toshkent shahar'] },
		{ latin: "Xorazm viloyati", kiril: "Хоразм вилояти", group: ['Xorazm'] },
	]

	private readonly indices: number[] = []

	constructor(userGroups: string[]) {
		const inAllGroup = userGroups.some(g => this.allGroups.includes(g))

		if (inAllGroup) {
			this.indices = this.newGroups.map((_, i) => i)
		} else {
			this.indices = this.newGroups
				.map((item, i) => item.group.some(g => userGroups.includes(g)) ? i : -1)
				.filter(i => i !== -1)
		}
	}

	public getGroups(key?: keyof Group): Array<string | number> {
		if (this.indices.length === 0) return []
		if (!key) return [...this.indices]

		return this.indices
			.map(i => this.newGroups[i][key])
			.filter(Boolean)
			.map(v => String(v))
			.sort((a, b) => a.localeCompare(b))
	}

	public gerWhere(field: string, key?: keyof Group): string {
		if (this.indices.length === this.newGroups.length) return '1=1'
		if (!key) return `${field} IN ( ${this.indices.join(", ")} )`
		if (this.indices.length === 0) return "1=0"

		return this.getGroups(key).map(v => `${field} LIKE '${v.toString().split(' ')[0]}%'`).join(" OR ")
	}
}

export const uType = [ // Название нужных нам типов
	"Мониторинг ўтказилган ҳудуднинг майдони",
	"Аниқланган объектлар",
	"Аҳоли яшаш жойларида эҳтимоли юқори бўлган ноқонуний чиқинди полигонлари сони",
	"Саноат зоналарида эҳтимоли юқори бўлган ноқонуний чиқинди полигонлари сони",
	"Дарё муҳофаза ҳудудидаги ноқонуний полигонлар сони",
	"Қонуний чиқинди полигонлари чегарасидан ташқарига чиқиш ҳолати сони"
]

export const downloadsData = [
	"Excel ( Умумий )",
	"Excel ( Кунлик )",
]

export const downloadFile = (blob: Blob, filename: string) => {
	const url = URL.createObjectURL(blob)

	const newTab = window.open('', '_blank')
	if (newTab) {
		newTab.document.write(`
          <html>
            <head>
              <title>Downloading ${filename}</title>
            </head>
            <body>
              <script>
                const link = document.createElement('a');
                link.href = '${url}';
                link.download = '${filename.replace(/'/g, "\\'")}';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => window.close(), 500);
              </script>
              <p>Downloading ${filename}...</p>
            </body>
          </html>
        `)
	}

	console.log("Downloaded: ", filename)

	setTimeout(() => {
		URL.revokeObjectURL(url)
	}, 5000)
}
