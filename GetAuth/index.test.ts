import trigger from ".";
it('redirects to a URL', async () => {
    const context = {} as any;
    await trigger(context, {} as any);
    expect(context.res.status).toBe(302);
    expect(context.res.headers.location).toBeDefined();
});