import { variables } from './ivariables';
import { default as axios } from 'axios';
import getTokenAsync from 'dyn365-access-token';

export async function getAccessToken(config: variables) {
  var req = {
    username: config.username,
    password: config.password,
    client_id: config.clientid,
    client_secret: config.clientsecret,
    resource: config.resource,
    commonAuthority: config.commonAuthority,
  };

  return await getTokenAsync(req);
}

export async function publishcrm(token: string, resource: string, apiversion: string): Promise<void> {
  try {
    const response = await axios.get(`${resource}/api/data/v${apiversion}/PublishAllXml`, {
      headers: {
        'cache-control': 'no-cache',
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
    });
  } catch (e) {
    console.log(e);
    throw e;
  }
}
