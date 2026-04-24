using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MitigramApi.Data;
using MitigramApi.Dtos;

namespace MitigramApi.Controllers;

[ApiController]
[Route("api/contacts")]
public class ContactsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<ContactDto>> GetAll() =>
        await db.Contacts
            .OrderBy(c => c.Name)
            .Select(c => new ContactDto(c.Id, c.Name, c.Email))
            .ToListAsync();
}
