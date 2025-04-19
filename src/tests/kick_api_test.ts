import { kickApiTools } from '../mcp/kick_api_tools';
import { secureTokenStore } from '../mcp/auth';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Mock the axios requests
const mock = new MockAdapter(axios);

describe('Kick API Tools', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mock.reset();
    // Mock the token store to return a valid token
    jest.spyOn(secureTokenStore, 'getAccessToken').mockReturnValue('mock_token');
  });

  afterEach(() => {
    jest.spyOn(secureTokenStore, 'getAccessToken').mockReset();
  });

  test('sendChatMessage should send a message to the specified channel', async () => {
    const channelId = 'test_channel';
    const message = 'Hello, this is a test message';
    const responseData = { id: 'msg_123', content: message, channel_id: channelId };

    mock.onPost(`https://kick.com/api/v1/channels/${channelId}/messages`).reply(200, responseData);

    const result = await kickApiTools.sendChatMessage(channelId, message);
    expect(result).toEqual(responseData);
  });

  test('getChannelInfo should retrieve information for the specified channel', async () => {
    const channelId = 'test_channel';
    const responseData = { id: channelId, name: 'Test Channel', followers: 100 };

    mock.onGet(`https://kick.com/api/v1/channels/${channelId}`).reply(200, responseData);

    const result = await kickApiTools.getChannelInfo(channelId);
    expect(result).toEqual(responseData);
  });

  test('getUserInfo should retrieve information for the specified user', async () => {
    const userId = 'test_user';
    const responseData = { id: userId, username: 'TestUser', bio: 'Test bio' };

    mock.onGet(`https://kick.com/api/v1/users/${userId}`).reply(200, responseData);

    const result = await kickApiTools.getUserInfo(userId);
    expect(result).toEqual(responseData);
  });

  test('followChannel should follow the specified channel', async () => {
    const channelId = 'test_channel';
    const responseData = { success: true, channel_id: channelId };

    mock.onPost(`https://kick.com/api/v1/channels/${channelId}/follow`).reply(200, responseData);

    const result = await kickApiTools.followChannel(channelId);
    expect(result).toEqual(responseData);
  });

  test('unfollowChannel should unfollow the specified channel', async () => {
    const channelId = 'test_channel';
    const responseData = { success: true, channel_id: channelId };

    mock.onDelete(`https://kick.com/api/v1/channels/${channelId}/follow`).reply(200, responseData);

    const result = await kickApiTools.unfollowChannel(channelId);
    expect(result).toEqual(responseData);
  });

  test('should throw error if no access token is available', async () => {
    jest.spyOn(secureTokenStore, 'getAccessToken').mockReturnValue(null);

    await expect(kickApiTools.sendChatMessage('test_channel', 'test message')).rejects.toThrow('No access token available. Please authenticate first.');
    await expect(kickApiTools.getChannelInfo('test_channel')).rejects.toThrow('No access token available. Please authenticate first.');
    await expect(kickApiTools.getUserInfo('test_user')).rejects.toThrow('No access token available. Please authenticate first.');
    await expect(kickApiTools.followChannel('test_channel')).rejects.toThrow('No access token available. Please authenticate first.');
    await expect(kickApiTools.unfollowChannel('test_channel')).rejects.toThrow('No access token available. Please authenticate first.');
  });

  test('getChatHistory should retrieve chat history for the specified channel', async () => {
    const channelId = 'test_channel';
    const responseData = { messages: [{ id: 'msg_1', content: 'Hello' }, { id: 'msg_2', content: 'Hi' }] };

    mock.onGet(`https://kick.com/api/v1/channels/${channelId}/messages`).reply(200, responseData);

    const result = await kickApiTools.getChatHistory(channelId);
    expect(result).toEqual(responseData);
  });

  test('deleteChatMessage should delete a message from the specified channel', async () => {
    const channelId = 'test_channel';
    const messageId = 'msg_123';
    const responseData = { success: true, message_id: messageId };

    mock.onDelete(`https://kick.com/api/v1/channels/${channelId}/messages/${messageId}`).reply(200, responseData);

    const result = await kickApiTools.deleteChatMessage(channelId, messageId);
    expect(result).toEqual(responseData);
  });

  test('startStream should start a stream for the specified channel', async () => {
    const channelId = 'test_channel';
    const responseData = { success: true, stream_id: 'stream_123' };

    mock.onPost(`https://kick.com/api/v1/channels/${channelId}/stream`).reply(200, responseData);

    const result = await kickApiTools.startStream(channelId);
    expect(result).toEqual(responseData);
  });

  test('endStream should end a stream for the specified channel', async () => {
    const channelId = 'test_channel';
    const responseData = { success: true, stream_id: 'stream_123' };

    mock.onDelete(`https://kick.com/api/v1/channels/${channelId}/stream`).reply(200, responseData);

    const result = await kickApiTools.endStream(channelId);
    expect(result).toEqual(responseData);
  });

  test('createPoll should create a poll in the specified channel', async () => {
    const channelId = 'test_channel';
    const question = 'Favorite Game?';
    const options = ['Game A', 'Game B', 'Game C'];
    const duration = 60;
    const responseData = { success: true, poll_id: 'poll_123' };

    mock.onPost(`https://kick.com/api/v1/channels/${channelId}/polls`).reply(200, responseData);

    const result = await kickApiTools.createPoll(channelId, question, options, duration);
    expect(result).toEqual(responseData);
  });

  test('createPrediction should create a prediction in the specified channel', async () => {
    const channelId = 'test_channel';
    const question = 'Who will win?';
    const options = ['Team A', 'Team B'];
    const duration = 60;
    const responseData = { success: true, prediction_id: 'pred_123' };

    mock.onPost(`https://kick.com/api/v1/channels/${channelId}/predictions`).reply(200, responseData);

    const result = await kickApiTools.createPrediction(channelId, question, options, duration);
    expect(result).toEqual(responseData);
  });

  test('should throw error if no access token is available for additional methods', async () => {
    jest.spyOn(secureTokenStore, 'getAccessToken').mockReturnValue(null);

    await expect(kickApiTools.getChatHistory('test_channel')).rejects.toThrow('No access token available. Please authenticate first.');
    await expect(kickApiTools.deleteChatMessage('test_channel', 'msg_123')).rejects.toThrow('No access token available. Please authenticate first.');
    await expect(kickApiTools.startStream('test_channel')).rejects.toThrow('No access token available. Please authenticate first.');
    await expect(kickApiTools.endStream('test_channel')).rejects.toThrow('No access token available. Please authenticate first.');
    await expect(kickApiTools.createPoll('test_channel', 'Question?', ['A', 'B'], 60)).rejects.toThrow('No access token available. Please authenticate first.');
    await expect(kickApiTools.createPrediction('test_channel', 'Predict?', ['A', 'B'], 60)).rejects.toThrow('No access token available. Please authenticate first.');
  });

});