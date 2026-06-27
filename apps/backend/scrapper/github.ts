import axios from 'axios';

export const gitHubScrapper = async(username: string)=>{
    const userReposDetails = await axios(`https://api.github.com/users/${username}/repos`, {
        proxy:{
            host: "p.webshare.io",
            port: 80,
            auth: {
                username: process.env.WEBSHARE_USERNAME!,
                password: process.env.WEBSHARE_PASSWORD!
            },
            protocol: "http"
        }
    })

    const filteredReposData = userReposDetails.data.map((x:any)=>({
        description: x.description,
        name: x.name,
        fullName: x.full_name,
        starCount: x.stargazers_count,
        languageUsed: x.language
    }));

    return filteredReposData;
}