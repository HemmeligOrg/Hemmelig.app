function getEmailDomain(email) {
    const parts = email.split('@');
    if (parts.length === 2) {
        return parts[1];
    } else {
        return email;
    }
}

export default getEmailDomain;
