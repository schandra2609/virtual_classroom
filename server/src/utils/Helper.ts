export default class Helper {
    static generateRandomCode = (length: number): string => {
        const charPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < length; i++)
            code += charPool.charAt(Math.floor(Math.random() * charPool.length));

        return code;
    };

    static isPasswordStrong = (password: string): boolean =>
        new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()])(?=.{8,})/).test(password);

    static sleep = (ms: number): Promise<void> =>
        new Promise(resolve => setTimeout(resolve, ms));

    static formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    static formatDateTime = (date: Date): string => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${this.formatDate(date)}T${hours}:${minutes}:${seconds}`;
    };
}