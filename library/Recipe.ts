import NFC from "./NFC";
import Pour from "./Pour";
import uuid from 'react-native-uuid';

export const CUP_TYPE = {
    XPOD: 0x00,
    OMNI: 0x02,
    TEA: 0x23,  // as on original tea recipe cards, 0x03 also works as tea
    OTHER: 0x04 // works as coffee, probably the same as Omni
}
// This byte value for the grind size disables the grinder
export const GRINDER_OFF: number = 41;
// Grind size is stored on the NFC card with offset (grind_size_value - 40)
export const GRIND_SIZE_OFFSET = 40;
export const DEFAULT_GRIND_SIZE = 50;

const POLY_TABLE = [
    0x00, 0x5E, 0xBC, 0xE2, 0x61, 0x3F, 0xDD, 0x83,
    0xC2, 0x9C, 0x7E, 0x20, 0xA3, 0xFD, 0x1F, 0x41,
    0x9D, 0xC3, 0x21, 0x7F, 0xFC, 0xA2, 0x40, 0x1E,
    0x5F, 0x01, 0xE3, 0xBD, 0x3E, 0x60, 0x82, 0xDC,
    0x23, 0x7D, 0x9F, 0xC1, 0x42, 0x1C, 0xFE, 0xA0,
    0xE1, 0xBF, 0x5D, 0x03, 0x80, 0xDE, 0x3C, 0x62,
    0xBE, 0xE0, 0x02, 0x5C, 0xDF, 0x81, 0x63, 0x3D,
    0x7C, 0x22, 0xC0, 0x9E, 0x1D, 0x43, 0xA1, 0xFF,
    0x46, 0x18, 0xFA, 0xA4, 0x27, 0x79, 0x9B, 0xC5,
    0x84, 0xDA, 0x38, 0x66, 0xE5, 0xBB, 0x59, 0x07,
    0xDB, 0x85, 0x67, 0x39, 0xBA, 0xE4, 0x06, 0x58,
    0x19, 0x47, 0xA5, 0xFB, 0x78, 0x26, 0xC4, 0x9A,
    0x65, 0x3B, 0xD9, 0x87, 0x04, 0x5A, 0xB8, 0xE6,
    0xA7, 0xF9, 0x1B, 0x45, 0xC6, 0x98, 0x7A, 0x24,
    0xF8, 0xA6, 0x44, 0x1A, 0x99, 0xC7, 0x25, 0x7B,
    0x3A, 0x64, 0x86, 0xD8, 0x5B, 0x05, 0xE7, 0xB9,
    0x8C, 0xD2, 0x30, 0x6E, 0xED, 0xB3, 0x51, 0x0F,
    0x4E, 0x10, 0xF2, 0xAC, 0x2F, 0x71, 0x93, 0xCD,
    0x11, 0x4F, 0xAD, 0xF3, 0x70, 0x2E, 0xCC, 0x92,
    0xD3, 0x8D, 0x6F, 0x31, 0xB2, 0xEC, 0x0E, 0x50,
    0xAF, 0xF1, 0x13, 0x4D, 0xCE, 0x90, 0x72, 0x2C,
    0x6D, 0x33, 0xD1, 0x8F, 0x0C, 0x52, 0xB0, 0xEE,
    0x32, 0x6C, 0x8E, 0xD0, 0x53, 0x0D, 0xEF, 0xB1,
    0xF0, 0xAE, 0x4C, 0x12, 0x91, 0xCF, 0x2D, 0x73,
    0xCA, 0x94, 0x76, 0x28, 0xAB, 0xF5, 0x17, 0x49,
    0x08, 0x56, 0xB4, 0xEA, 0x69, 0x37, 0xD5, 0x8B,
    0x57, 0x09, 0xEB, 0xB5, 0x36, 0x68, 0x8A, 0xD4,
    0x95, 0xCB, 0x29, 0x77, 0xF4, 0xAA, 0x48, 0x16,
    0xE9, 0xB7, 0x55, 0x0B, 0x88, 0xD6, 0x34, 0x6A,
    0x2B, 0x75, 0x97, 0xC9, 0x4A, 0x14, 0xF6, 0xA8,
    0x74, 0x2A, 0xC8, 0x96, 0x15, 0x4B, 0xA9, 0xF7,
    0xB6, 0xE8, 0x0A, 0x54, 0xD7, 0x89, 0x6B, 0x35,
];


class Recipe {
    public uuid: string = "";
    public title: string = "";
    public xid: string = "";
    public key: string = ""
    public ratio: number = -1;
    public dosage: number = 15;
    public grindSize: number = -1;
    public grindRPM: number = 120;
    public grinder: boolean = true;
    public pours: Pour[] = [];
    public checksum: number = -1;
    public prefixArray: number[] = [];
    public suffixArray: number[] = [];
    public cupType: number = CUP_TYPE.XPOD;


    constructor(data?: number[], json?: string) {
        this.uuid = (uuid.v4() as string);
        this.key = this.uuid;

        if (data) {
            this.parseData(data);
            return;
        }
        if (json) {
            let jsonRecipe = JSON.parse(json);
            this.grindRPM = jsonRecipe.grindRPM;
            this.grindSize = jsonRecipe.grindSize;
            this.cupType = jsonRecipe.cupType ?? CUP_TYPE.XPOD;
            this.grinder = jsonRecipe.grinder ?? true;

            if (jsonRecipe.uuid) {
                this.uuid = jsonRecipe.uuid;
            } else {
                this.uuid = (uuid.v4() as string);
            }
            this.key = this.uuid;
            for (let i = 0; i < jsonRecipe.pours.length; i++) {
                let pour = typeof (jsonRecipe.pours[i]) == 'string' ? JSON.parse(jsonRecipe.pours[i]) : jsonRecipe.pours[i];
                if (pour.pauseTime == 256) {
                    pour.pauseTime = 0;
                }
                let p = new Pour(
                    (pour.pourNumber),
                    pour.volume,
                    pour.temperature,
                    pour.flowRate,
                    pour.agitation,
                    pour.pourPattern,
                    pour.pauseTime);
                this.pours.push(p);
            }
            this.prefixArray = jsonRecipe.prefixArray;
            this.suffixArray = jsonRecipe.suffixArray;
            this.ratio = jsonRecipe.ratio;
            this.title = jsonRecipe.title;
            this.xid = jsonRecipe.xid;
            if (jsonRecipe.dosage) {
                this.dosage = jsonRecipe.dosage;
            }
            this.checksum = jsonRecipe.checksum;
        }

    }

    public addPour(pourNumber: number) {
        const newPour = new Pour(pourNumber + 2, 1, 39, 30, 0, 0, 0);
        this.pours.splice(pourNumber + 1, 0, newPour);
        for (let i = 0; i < this.pours.length; i++) {
            this.pours[i].pourNumber = i + 1;
        }
    }

    public generateNewUUID() {
        this.uuid = (uuid.v4() as string);
        this.key = this.uuid;
    }

    public deletePour(pourNumber: number) {
        this.pours.splice(pourNumber, 1);
        for (let i = 0; i < this.pours.length; i++) {
            this.pours[i].pourNumber = i + 1;
        }
    }

    public getTotalVolume(): number {
        return this.dosage * this.ratio
    }

    public getPourTotalVolume(): number {
        let totalVolume = 0;
        for (let pour of this.pours) {
            if (pour.volume > 0) {
                totalVolume += pour.getVolume();
            }
        }
        return totalVolume;
    }

    public isPourVolumeValid(): boolean {
        return this.getPourTotalVolume() === this.getTotalVolume();
    }

    public isTea(): boolean {
        return this.cupType == CUP_TYPE.TEA;
    }

    public getCupTypeName(): string {
        return Recipe.getCupTypeText(this.cupType);
    }

    public static getCupTypeText(cupType: number): string {
        switch (cupType) {
            case CUP_TYPE.XPOD:
                return "xPod";
            case CUP_TYPE.OMNI:
                return "Omni";
            case CUP_TYPE.TEA:
                return "Tea";
            case CUP_TYPE.OTHER:
                return "Other";
            default:
                return "Unknown";
        }
    }

    // Function to calculate CRC-8/MAXIM-DOW
    private calculateCRC(array: number[]): number {
        const crcTable = POLY_TABLE//this.createCrcTable();
        let crc = 0x00; // Initial value for CRC-8/MAXIM-DOW

        array.forEach((byte) => {
            crc = crcTable[(crc ^ byte) & 0xff];
        });

        return crc ^ 0x00; // Final XOR value (reflected output)
    }

    public async writeCard(nfc: NFC, progressCallBack: (progress: number, id?: string) => Promise<string | undefined>) {
        console.log("Writing Card");
        try {
            await nfc.init();
            await nfc.open();
            let hash = await nfc.readHash();
            console.log("Read Hash:" + this.convertNumberArrayToHex(hash!));

            if (hash) {
                let data = this.getData(hash);
                console.log(this.convertNumberArrayToHex(data));
                await nfc.writeCard(data, progressCallBack);
            }
        } catch (e) {
            if (!nfc.getIsClosed()) { //make sure NFC reading wasn't closed by user --really just an android problem
                throw new Error("Error writing card: " + e);
            }
        } finally {
            await nfc.close();
        }
    }


    public async readCard(nfc: NFC, progressCallBack: (progress: number, id?: string) => Promise<string | undefined>): Promise<boolean> {
        console.log('Read Card')
        try {
            await nfc.init();
            await nfc.open();
            await progressCallBack(20)
            let data = await nfc.readCard(progressCallBack);
            await progressCallBack(90)
            await nfc.close();
            await progressCallBack(100)
            if (data) {
                console.log(nfc.convertNumberArrayToHex(data));

                this.parseData(data);

                console.log(this.toString());
                return true;
            } else {
                throw new Error("No data read from card");
            }
        } catch (e) {
            if (!nfc.getIsClosed()) {
                throw new Error("Error reading card: " + e);
            }
        } finally {
            await nfc.close();
        }
        return false;
    }

    public getData(prefix: number[]): number[] {
        let data: number[] = [];

        if (prefix && prefix.length > 0) {
            data = data.concat(prefix);
        } else {
            data = data.concat(this.prefixArray);
        }
        console.log("Prefix:" + this.convertNumberArrayToHex(data));

        data = data.concat(this.convertXIDToData(this.xid));

        data.push(this.cupType);

        data.push(this.pours.length << 3);
        let pourNumber = 0;
        for (let pour of this.pours) {
            pourNumber++;
            data.push(pour.getVolume());
            data.push(pour.getTemperature());
            data.push(pour.getPourPattern());
            data.push(pour.getAgitation());
            if (pour.getPauseTime() == 0) {
                data.push(0x00);
            } else {
                data.push(256 + (0 - pour.getPauseTime()));
            }
            if (pourNumber === 1) {
                data.push(this.dosage);   // 5th byte of the first pour stores the dose
                if (this.grinder) {
                    data.push(this.grindRPM); // 6th byte of the first pour stores the RPM
                } else {
                    data.push(0x00);
                }
            } else {
                data.push(0x00);
                data.push(0x00);
            }
            data.push(pour.getFlowRate());
        }

        if (this.isTea()) {
            // tea cards use the default grind size
            data.push(DEFAULT_GRIND_SIZE - GRIND_SIZE_OFFSET);
        } else {
            if (this.grinder) {
                data.push(this.grindSize - GRIND_SIZE_OFFSET);
            } else {
                data.push(GRINDER_OFF); // setting grind size to 41 (0x29) disables the grinder
            }
        }

        data.push(this.ratio);
        let checkSum = this.calculateCRC(data);
        console.log("CheckSum:" + this.convertNumberArrayToHex(data));
        console.log("CheckSum:" + checkSum + ":" + this.checksum);
        data.push(checkSum);

        data.push(0x00);
        data.push(0x00); //this is usually F4 (but not always), but it doesn't seem to matter

        /*var suffix = [];
        for (let i = 0; i < this.suffixArray.length; i++) {
           suffix[i] = 0;
        }*/
        //data = data.concat(suffix);
        //data = data.concat(this.suffixArray);
        data.splice(0, 32);
        return data
    }

    public autoFixPourVolumes() {
        if (this.isTea()) { // set all pours to 90 ml for tea
            for (let pour of this.pours) {
                pour.volume = 90;
            }
            this.fixRatio();
            return;
        }
        if (this.pours.length == 1) { //if just 1 pour set to total volume
            this.pours[0].volume = this.getTotalVolume();
        } else if (this.pours.length > 1 && this.getPourTotalVolume() == 0) {
            //this is where pours have been added, but not volume has been set
            //set the bloom to double dosage, and disribute rest evenly
            this.pours[0].volume = this.dosage * 2;
            for (let i = 1; i < this.pours.length; i++) {
                this.pours[i].volume = (Math.round(this.getTotalVolume() - this.pours[0].volume) / (this.pours.length - 1));
            }
            //tack on/remove any extra thst occurs because of rounding to last pour
            if (this.getTotalVolume() - this.getPourTotalVolume() != 0) {
                let diff = this.getTotalVolume() - this.getPourTotalVolume();
                this.pours[this.pours.length - 1].volume += diff;
            }
        } else if (this.pours.length > 1 && this.getPourTotalVolume() !== 0) {
            //this is auto adjusts each pour by scale factor
            //then to the extent due to rounding it doesn't add up to total, it adjusts intelligently
            let pourTotal = this.getPourTotalVolume();
            let totalVolume = this.getTotalVolume();
            // Calculate the scaling factor
            const scalingFactor = totalVolume / pourTotal;

            let pourVolumeMap = [];
            for (let i = 0; i < this.pours.length; i++) {
                pourVolumeMap.push({
                    pourIndex: i,
                    origVolume: this.pours[i].volume,
                    scaledVolume: this.pours[i].volume * scalingFactor,
                    roundedScaledVolume: Math.round(this.pours[i].volume * scalingFactor)
                });
            }

            // Calculate the difference caused by rounding
            const scaledTotal = pourVolumeMap.reduce((sum, pour) => sum + pour.roundedScaledVolume, 0);
            const difference = totalVolume - scaledTotal;

            if (difference !== 0) {
                // Get the fractional differences from the rounded values
                const adjustments = pourVolumeMap.map((value, index) => ({
                    index,
                    diff: value.roundedScaledVolume - value.scaledVolume
                }));

                // Sort adjustments by how far they are from the rounded value
                adjustments.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

                // Incrementally adjust to correct the difference
                let remainingDifference = difference;
                for (let i = 0; remainingDifference !== 0; i++) {
                    const targetIndex = adjustments[i % adjustments.length].index;
                    pourVolumeMap[targetIndex].roundedScaledVolume += Math.sign(remainingDifference);
                    remainingDifference -= Math.sign(remainingDifference);
                }
            }
            // Update the pour volumes
            for (let i = 0; i < pourVolumeMap.length; i++) {
                this.pours[pourVolumeMap[i].pourIndex].volume = pourVolumeMap[i].roundedScaledVolume;
            }
        }
    }

    public convertNumberArrayToHex(array: number[]): string {
        let hexOutput = ''
        for (let i = 0; i < array.length; i++) {
            let hex = array[i].toString(16);
            if (hex.length == 1) {
                hex = '0' + hex;
            }
            hexOutput += "" + hex;
        }
        return hexOutput;
    }

    private convertDataToXID(data: number[]): string {
        let index = data.length - 1
        while (index >= 0) {
            if (data[index] !== 0) {
                break;
            }
            index--;
        }
        return String.fromCharCode(...data.slice(0, index + 1)).trim()
    }

    private convertXIDToData(xid: string): number[] {
        let result: number[] = [];
        if (xid.length > 8) {
            throw new Error("XID must be less than 8 characters")
        } else if (xid.length <= 8) {
            for (let i = 0; i < xid.length; i++) {
                result.push(xid.charCodeAt(i));
            }
            //add padding
            for (let i = xid.length; i < 7; i++) {
                result.push(0);
            }
        }
        return result;
    }


    private parseData(data: number[]) {
        this.prefixArray = data.slice(0, 32);

        this.xid = this.convertDataToXID(data.slice(32, 39));

        this.cupType = data[39];

        // Cascara Coffee Cherry Tea card uses 0x13, 0x03 also works as tea
        if (this.cupType == 0x13 || this.cupType == 0x03) {
            console.log("Fixing 0x13 cup type to 0x23 (tea)");
            this.cupType = CUP_TYPE.TEA;
        }

        // Tea recipe, use 5g dose by default
        if (this.isTea()) {
            this.dosage = 5;
        }

        let numberOfPours = data[40] >> 3;

        let poursDataLength = numberOfPours * 8;
        this.suffixArray = data.slice(44 + poursDataLength, data.length);

        this.grindSize = data[41 + poursDataLength] + GRIND_SIZE_OFFSET

        if (this.grindSize == GRIND_SIZE_OFFSET + GRINDER_OFF) {
            this.grinder = false;
        }

        this.ratio = data[42 + poursDataLength]
        this.checksum = data[43 + poursDataLength]


        let index = 41;
        let pourNum = 1;
        let poursVolume = 0;

        while (index < 41 + poursDataLength) {

            let volume = data[index]
            let temp = data[index + 1]
            let pattern = data[index + 2]
            let agitation = data[index + 3]
            let pause = 256 - data[index + 4]
            let flow = data[index + 7]

            if (this.isTea() && volume > 90) {
                console.log("Fixing tea pour volume to 90ml, was: " + volume + "ml")
                volume = 90;
            }

            const dose = data[index + 5]
            const rpm = data[index + 6]

            if (dose !== 0 || rpm !== 0 && pourNum == 1) {
                console.log(`Found dose/RPM data: ${pourNum}: ${Recipe.byteToHex(dose)}=${dose} ${Recipe.byteToHex(rpm)}=${rpm}`);
                this.grindRPM = (rpm >= 60 && rpm <= 120) ? rpm : 120;
                this.dosage = (dose >= 1 && dose <= 25) ? dose : this.isTea() ? 5 : 15;
            }

            let pour = new Pour(pourNum, volume, temp, flow, agitation, pattern, pause);
            this.pours.push(pour);

            poursVolume += volume;
            index += 8
            pourNum++;
        }

        const byte44 = data[poursDataLength + 44]
        const byte45 = data[poursDataLength + 45]

        if (byte44 !== 0 || byte45 !== 0) {
            console.log(`Byte44/45: ${Recipe.byteToHex(byte44)} ${Recipe.byteToHex(byte45)}`);
        }

        if (this.isTea()) {
            // adjust the ratio if the volume was fixed
            this.fixRatio();
        }
    }

    public fixRatio() {
        this.ratio = Math.round(this.getPourTotalVolume() / this.dosage);
    }

    public static byteToHex(b: number) {
        return `0x` + b.toString(16).padStart(2, '0');
    }

    public toString(): string {
        return `Recipe: ${this.title}
    XID: ${this.xid}
    Cup: ${this.cupType}
    Dose: ${this.dosage}
    Ratio: 1:${this.ratio}
    Grind Size: ${this.grindSize}
    Grind RPM: ${this.grindRPM}
    Pours: ${this.pours.map(pour => pour.toString()).join(", ")}`
    }
}

export default Recipe;
