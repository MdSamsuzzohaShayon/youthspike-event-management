const nodemailer = require('nodemailer');

function formateMatchLinkToEmailBody(date: Date, location: string, teamName: string, teamNameOpposite: string, coachName: string, coachNameOpposite: string, link: string, send_to: string, Opposite_mail: string){
    const formatMessage = `<!DOCTYPE html>
    <html>
        <head>
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                    background-color: #D3D3D3
                }

                th, td {
                    border: 1px solid black;
                    padding: 8px;
                    text-align: left;
                }

                th {
                    background-color: #f2f2f2;
                    color : #000000
                }

                h2 {
                    text-align: center;
                }
            </style>
        </head>
        <body>
            Dear ${coachName},
            <br>
            <br>
            As the coach of the squad ${teamName}, you are designated to control the placing and matching of your lineups during a match.
            <br>
            <br>
            A match has been created for you that is scheduled to take place on ${date} in the following location, ${location}.
            <br>
            <h2>Match Details</h2>
            <br>
            <table>
                <tr>
                    <th>SQUADS in the Match</th>
                    <td>${teamName} vs ${teamNameOpposite}</th>
                </tr>
                <tr>
                    <th>Coach of the opposing team ${teamNameOpposite}</th>
                    <td>${coachNameOpposite}</td>
                </tr>
                <tr>
                    <th>Opposing squad’s email</th>
                    <td>${Opposite_mail}</td>
                </tr>
                <tr>
                    <th>Link for your squad’s access to the match</th>
                    <td><a href=${link}>Match Link</a></td>
                </tr>
            </table>
            <br>
            <br>
            Link will be expired in next 24 hours. In case of any query please contact <b>Admin</b>.
            <br>
            <br>
            Best regards,
            <br>
            American Spikers Team
        </body>
    </html>`;
    return formatMessage;
}

export function sendMail(date: Date, location: string, teamName: string, teamNameOpposite: string, coachName: string, coachNameOpposite: string, link: string, send_to: string, Opposite_mail: string):Promise<string> {
    let month = date.toLocaleString('default', { month: 'long' });
    let day = date.getDate();
    let year =  date.getFullYear();
    const transporter = nodemailer.createTransport({
        host: process.env["EMAIL_HOST"],
        port: 587,
        auth: {
            user: process.env["EMAIL_USER"], // generated ethereal user
            pass: process.env["EMAIL_PASS"], // generated ethereal password
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const options = {
        from: process.env["EMAIL_USER"],
        to: send_to,
        subject: `Link of Match on ${day}-${month} ${year}`,
        html: formateMatchLinkToEmailBody(date, location, teamName, teamNameOpposite, coachName, coachNameOpposite, link, send_to, Opposite_mail),
    }

    // send Mail
    return new Promise((resolve, reject) => {
        transporter.sendMail(options).then(()=>{
            resolve(`Mail Send to ${send_to}`);
        }).catch((err)=>{
            resolve(`Please contact Admin`);
        })
    });
}
